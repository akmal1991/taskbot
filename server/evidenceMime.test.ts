import { expect, it } from 'bun:test';
import * as XLSX from 'xlsx';
import { evidenceMime } from './evidenceMime';
it('accepts a real Excel evidence package and rejects truncated or unrelated files',()=>{
  const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['Evidence'],['Completed work']]));
  const buffer=Buffer.from(XLSX.write(book,{type:'buffer',bookType:'xlsx'}));
  expect(evidenceMime(buffer)).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  expect(evidenceMime(buffer.subarray(0,100))).toBeNull();
  expect(evidenceMime(Buffer.from('not a document'))).toBeNull();
  expect(evidenceMime(Buffer.alloc(0))).toBeNull();
});
