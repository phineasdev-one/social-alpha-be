export const validation = {
  PASSWORD_MIN_LENGTH: 6,
  REGEX_DATE_FORMAT_STRING:
    '^(0[1-9]|[12][0-9]|3[01])\\/(0[1-9]|1[0-2])\\/\\d{4}$',
  REGEX_PHONE_NUMBER_FORMAT: '^(0[689]{1})+([0-9]{8})+$',
  REGEX_EMAIL_FORMAT: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_LIMIT: 1,
  MAX_LIMIT: 1000,
  MIN_PAGE: 1,
  MAX_PAGE: 1000,
};
