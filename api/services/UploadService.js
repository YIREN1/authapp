const Tesseract = require('tesseract.js');

const { TesseractWorker } = Tesseract;

const worker = new TesseractWorker();

const UploadService = {};

UploadService.processFileForOCR = file => {
  return worker
    .recognize(file, 'eng+chi_tra', {
      tessjs_create_pdf: '1',
    })
    .progress(progress => {
      console.log('progress', progress);
    })
    .then(result => {
      console.log('result', result.text);
      return result.text;
    });
};
module.exports = UploadService;
