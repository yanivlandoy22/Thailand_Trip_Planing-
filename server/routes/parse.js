const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { parseBookingText, parseBookingPdfVision } = require('../services/parser');
const { requireOrganizer } = require('../middleware/auth');
const { stashPending } = require('../services/ticketStore');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Below this many characters we assume the PDF is scanned/image-only and
// fall back to sending the PDF itself to Claude (vision path).
const MIN_TEXT_LENGTH = 120;

// POST /api/parse/text  {text} — organizer only
router.post('/text', requireOrganizer, async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'יש להדביק טקסט לניתוח' });
    res.json(await parseBookingText(text.trim()));
  } catch (err) {
    next(err);
  }
});

// POST /api/parse/pdf  multipart(file) — organizer only
router.post('/pdf', requireOrganizer, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'יש לצרף קובץ PDF' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'ניתן להעלות קבצי PDF בלבד' });
    }

    let text = '';
    try {
      const parsed = await pdfParse(req.file.buffer);
      text = (parsed.text || '').trim();
    } catch {
      // Corrupt text layer — the vision path below handles it.
      text = '';
    }

    const result =
      text.length >= MIN_TEXT_LENGTH
        ? await parseBookingText(text)
        : await parseBookingPdfVision(req.file.buffer);

    // Stash the original file so saving the parsed booking can attach it as
    // the ticket without a second upload (claimed via pending_ticket_id).
    result.pending_ticket_id = stashPending(req.file.buffer);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
