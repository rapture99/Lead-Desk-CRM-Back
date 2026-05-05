const router = require('express').Router();
const multer = require('multer');
const controller = require('../controllers/lead.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (allowedTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Only Excel or CSV files are supported.'));
  },
});

router.post('/', controller.createLead);
router.post('/import', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    return controller.importLeads(req, res, next);
  });
});
router.get('/import/template', controller.downloadLeadTemplate);
router.get('/', controller.getLeads);
router.get('/:id', controller.getLeadById);
router.put('/:id', controller.updateLead);

module.exports = router;
