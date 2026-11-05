// Inspect OOXML directory entries without extracting or executing document content.
export function evidenceMime(buffer: Buffer): string | null {
  if(buffer.length<8) return null;
  if (buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer[0]===255 && buffer[1]===216 && buffer[2]===255) return 'image/jpeg';
  if (buffer.subarray(0,5).toString()==='%PDF-') return 'application/pdf';
  if (buffer.readUInt32LE(0)!==0x04034b50) return null;
  let end=-1;
  for(let offset=buffer.length-22;offset>=Math.max(0,buffer.length-65557);offset--) if(buffer.readUInt32LE(offset)===0x06054b50){end=offset;break;}
  if(end<0) return null;
  const count=buffer.readUInt16LE(end+10), names=new Set<string>();
  let offset=buffer.readUInt32LE(end+16), total=0;
  for(let i=0;i<count;i++) {
    if(offset+46>buffer.length || buffer.readUInt32LE(offset)!==0x02014b50 || buffer.readUInt16LE(offset+8)&1) return null;
    const length=buffer.readUInt16LE(offset+28),extra=buffer.readUInt16LE(offset+30),comment=buffer.readUInt16LE(offset+32);
    total+=buffer.readUInt32LE(offset+24); if(total>50*1024*1024 || offset+46+length+extra+comment>buffer.length) return null;
    names.add(buffer.subarray(offset+46,offset+46+length).toString()); offset+=46+length+extra+comment;
  }
  if(!names.has('[Content_Types].xml') || [...names].some(n=>/vbaProject\.bin$/i.test(n))) return null;
  if(names.has('word/document.xml')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if(names.has('xl/workbook.xml')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return null;
}
