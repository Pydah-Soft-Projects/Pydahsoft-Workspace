const {
  getSuperiorDashboard,
  getTeamLeadDashboard,
  getEmployeeDashboard
} = require('../services/dashboardService');

const getSuperiorDash = async (req, res) => {
  try {
    const data = await getSuperiorDashboard();
    res.status(200).json({
      success: true,
      data,
      message: 'Superior dashboard retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching superior dashboard' }
    });
  }
};

const getTeamLeadDash = async (req, res) => {
  try {
    const data = await getTeamLeadDashboard(req.user._id);
    res.status(200).json({
      success: true,
      data,
      message: 'Team Lead dashboard retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching team lead dashboard' }
    });
  }
};

const getEmployeeDash = async (req, res) => {
  try {
    const targetEmployeeId = req.query.employeeId || req.user._id;
    const data = await getEmployeeDashboard(targetEmployeeId);
    res.status(200).json({
      success: true,
      data,
      message: 'Employee dashboard retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching employee dashboard' }
    });
  }
};

module.exports = {
  getSuperiorDash,
  getTeamLeadDash,
  getEmployeeDash
};
