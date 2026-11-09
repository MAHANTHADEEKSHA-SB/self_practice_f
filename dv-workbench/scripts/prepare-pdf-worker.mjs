import {createRequire} from 'node:module';
import {mkdir,copyFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const publicDirectory=new URL('../public/',import.meta.url);
await mkdir(publicDirectory,{recursive:true});
await copyFile(require.resolve('pdfjs-dist/build/pdf.worker.min.mjs'),new URL('pdf.worker.min.mjs',publicDirectory));
