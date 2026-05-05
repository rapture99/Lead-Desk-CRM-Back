const { Lead, Note } = require('../models');
const { Op, Sequelize } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    // Total leads
    const totalLeads = await Lead.count();

    // Status distribution
    let statusData = [];
    try {
      statusData = await Lead.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('status')), 'count'],
        ],
        group: ['status'],
      });
    } catch (err) {
      console.error('Status aggregation error:', err.message);
    }

    // Source distribution
    let sourceData = [];
    try {
      sourceData = await Lead.findAll({
        attributes: [
          'source',
          [Sequelize.fn('COUNT', Sequelize.col('source')), 'count'],
        ],
        group: ['source'],
      });
    } catch (err) {
      console.error('Source aggregation error:', err.message);
    }

    // Closed leads
    let closedLeads = 0;
    try {
      closedLeads = await Lead.count({
        where: { status: 'Closed' },
      });
    } catch (err) {
      console.error('Closed leads error:', err.message);
    }

    // Conversion rate
    const conversionRate = totalLeads
      ? ((closedLeads / totalLeads) * 100).toFixed(2)
      : 0;

    res.json({
      totalLeads,
      statusData,
      sourceData,
      conversionRate,
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
};  