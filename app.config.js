// app.config.js
export default {
  expo: {
    // ...other config...
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  },
};