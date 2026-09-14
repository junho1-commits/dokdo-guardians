const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png'};
const server=http.createServer((req,res)=>{
 let filename;
 try{filename=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);return res.end('Bad request');}
 if(filename===root)filename=path.join(root,'index.html');
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 if(!types[path.extname(filename)]){res.writeHead(404);return res.end('Not found');}
 fs.readFile(filename,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'no-cache'});res.end(data);});
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Port 4173 is already in use. Open http://127.0.0.1:4173/ or close the existing server.':err.message);process.exitCode=1;});
server.listen(4173,'127.0.0.1',()=>console.log('Dokdo Explorers: http://127.0.0.1:4173/\nPress Ctrl+C to stop.'));
