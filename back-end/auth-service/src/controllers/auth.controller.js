const authService = require('../services/auth.service');
const { responseHelper } = require('../../../shared');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return responseHelper.created(res, result, 'Account registered successfully');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    return responseHelper.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return responseHelper.success(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user.accountId, refreshToken);
    return responseHelper.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const account = await authService.getAccountById(req.user.accountId);
    return responseHelper.success(res, account);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.accountId, oldPassword, newPassword);
    return responseHelper.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const result = await authService.googleLogin(idToken);
    return responseHelper.success(res, result, 'Google login successful');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return responseHelper.success(res, result, 'Reset code sent if email exists');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPassword(email, code, newPassword);
    return responseHelper.success(res, result, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, email } = req.body;
    const result = await authService.updateProfile(req.user.accountId, { fullName, email });
    return responseHelper.success(res, result, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
    }
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const result = await authService.updateAvatar(req.user.accountId, avatarPath);
    return responseHelper.success(res, result, 'Avatar updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  forgotPassword,
  resetPassword,
};
