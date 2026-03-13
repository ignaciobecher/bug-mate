import Joi from 'joi';

/**
 * Joi validation schema for .env variables.
 * Only secrets and infrastructure config live here.
 * All bot behavior config lives in config/*.json
 */
export const botConfigSchema = Joi.object({
  PORT: Joi.number().default(3000),

  // ── Gemini ───────────────────────────────────────────────────
  GEMINI_API_KEY: Joi.string().required().description('Google Gemini API key'),

  // ── Ollama (optional, kept for backwards compat) ─────────────
  OLLAMA_URL: Joi.string().uri().default('http://localhost:11434'),
  OLLAMA_MODEL: Joi.string().default('qwen3:8b'),
  OLLAMA_AUTO_START: Joi.boolean().default(false),

  // ── Developer contact (secrets, not in JSON) ─────────────────
  DEVELOPER_NAME: Joi.string().required(),
  DEVELOPER_PHONE: Joi.string().pattern(/^\d+$/, 'digits only').required(),
});
