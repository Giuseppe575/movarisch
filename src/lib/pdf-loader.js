import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'src/lib/pdf.worker.min.mjs';
window.pdfjsLib = pdfjsLib;
