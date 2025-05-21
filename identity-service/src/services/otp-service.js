const otp = Math.floor(100000 + Math.random() * 900000).toString();
const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

const otpService = {
  generateOtp: function () {
    return otp;
  },
  setOtpExpires: function () {
    return otpExpires;
  },
  verifyOtp: function (inputOtp, storedOtp) {
    return inputOtp === storedOtp;
  },
};

module.exports = otpService;