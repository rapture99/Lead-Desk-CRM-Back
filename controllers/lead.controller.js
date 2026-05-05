const { Lead, Note } = require('../models');
const { Op } = require('sequelize');
const xlsx = require('xlsx');

const VALID_STATUSES = ['New', 'Contacted', 'Site Visit', 'Closed'];
const DEFAULT_SOURCE = 'Referral';
const TEMPLATE_HEADERS = [
  'name',
  'phone',
  'email',
  'budget',
  'location',
  'property type',
  'source',
  'status',
];

const headerAliases = {
  name: 'name',
  fullname: 'name',
  leadname: 'name',
  customername: 'name',
  phone: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  mobilenumber: 'phone',
  contact: 'phone',
  contactnumber: 'phone',
  email: 'email',
  emailaddress: 'email',
  budget: 'budget',
  location: 'location',
  city: 'location',
  propertytype: 'propertyType',
  property: 'propertyType',
  requirement: 'propertyType',
  source: 'source',
  status: 'status',
};

const normalizeHeader = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const normalizeCell = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeRow = (row) =>
  Object.entries(row).reduce((lead, [header, value]) => {
    const field = headerAliases[normalizeHeader(header)];
    if (field) lead[field] = normalizeCell(value);
    return lead;
  }, {});

const parseBudget = (value) => {
  const cleaned = normalizeCell(value).replace(/,/g, '');
  if (!cleaned) return null;

  const budget = Number(cleaned);
  return Number.isFinite(budget) ? Math.round(budget) : null;
};

exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an Excel file.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return res.status(400).json({ error: 'The uploaded file does not contain any sheets.' });
    }

    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: '',
      raw: false,
    });

    const leads = [];
    const skipped = [];

    rows.forEach((row, index) => {
      const lead = normalizeRow(row);
      const rowNumber = index + 2;
      const phoneDigits = normalizeCell(lead.phone).replace(/\D/g, '');

      if (!normalizeCell(lead.name)) {
        skipped.push({ row: rowNumber, reason: 'Name is required.' });
        return;
      }

      if (!phoneDigits || phoneDigits.length < 10) {
        skipped.push({ row: rowNumber, reason: 'A valid phone number is required.' });
        return;
      }

      const budget = parseBudget(lead.budget);

      if (lead.budget && budget === null) {
        skipped.push({ row: rowNumber, reason: 'Budget must be a number.' });
        return;
      }

      const status = VALID_STATUSES.includes(lead.status) ? lead.status : 'New';

      leads.push({
        name: normalizeCell(lead.name),
        phone: normalizeCell(lead.phone),
        email: normalizeCell(lead.email) || null,
        budget,
        location: normalizeCell(lead.location) || null,
        propertyType: normalizeCell(lead.propertyType) || null,
        source: normalizeCell(lead.source) || DEFAULT_SOURCE,
        status,
      });
    });

    if (!leads.length) {
      return res.status(400).json({
        error: 'No valid leads were found in the uploaded file.',
        skipped,
      });
    }

    const imported = await Lead.bulkCreate(leads, { returning: true });

    return res.json({
      imported: imported.length,
      skipped,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.downloadLeadTemplate = (req, res) => {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet([TEMPLATE_HEADERS]);

  worksheet['!cols'] = TEMPLATE_HEADERS.map((header) => ({
    wch: Math.max(header.length + 4, 14),
  }));

  xlsx.utils.book_append_sheet(workbook, worksheet, 'Leads');

  const buffer = xlsx.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  res.setHeader('Content-Disposition', 'attachment; filename="lead-import-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buffer);
};

exports.getLeads = async (req, res) => {
  try {
    const {
      search,
      status,
      source,
      sortBy = 'createdAt',
      sortDir = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    let where = {};
    const sortableColumns = ['name', 'phone', 'budget', 'source', 'status', 'createdAt'];
    const safeSortBy = sortableColumns.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortDir = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) where.status = status;
    if (source) where.source = source;

    const { rows, count } = await Lead.findAndCountAll({
      where,
      order: [[safeSortBy, safeSortDir]],
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
    });

    res.json({
      leads: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: count,
        totalPages: Math.max(Math.ceil(count / safeLimit), 1),
      },
      sort: {
        sortBy: safeSortBy,
        sortDir: safeSortDir.toLowerCase(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: Note,
    });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    await Lead.update(req.body, {
      where: { id: req.params.id },
    });
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
