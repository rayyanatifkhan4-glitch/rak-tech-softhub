/**
 * RAKTechSoftHub — High-Performance Local Static Server
 * Zero-dependency: Built entirely with Node.js standard library.
 * Full support for HTTP 206 Partial Content (Video Streaming Range Requests).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, 'Website');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function serveFile(req, res, filePath, stat) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    // Handle Video Streaming / Byte Range requests (HTTP 206)
    if (range && (ext === '.mp4' || ext === '.webm')) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

        if (start >= stat.size || end >= stat.size) {
            res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
            return res.end();
        }

        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });

        fileStream.pipe(res);
    } else {
        // Standard full-file response (HTTP 200)
        res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache, must-revalidate'
        });

        fs.createReadStream(filePath).pipe(res);
    }
}

const server = http.createServer((req, res) => {
    // Parse URL and strip query strings or hash fragments
    const cleanUrl = decodeURI(req.url.split('?')[0].split('#')[0]);
    let safePath = path.normalize(cleanUrl).replace(/^(\.\.[\/\\])+/, '');
    let fullPath = path.join(PUBLIC_DIR, safePath);

    fs.stat(fullPath, (err, stat) => {
        if (err) {
            // Check if adding .html helps
            fs.stat(fullPath + '.html', (err2, stat2) => {
                if (!err2 && stat2.isFile()) {
                    return serveFile(req, res, fullPath + '.html', stat2);
                }
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`404 Not Found: ${cleanUrl}`);
            });
            return;
        }

        if (stat.isDirectory()) {
            const indexPath = path.join(fullPath, 'index.html');
            fs.stat(indexPath, (err3, stat3) => {
                if (!err3 && stat3.isFile()) {
                    return serveFile(req, res, indexPath, stat3);
                }
                res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('403 Directory Listing Forbidden');
            });
            return;
        }

        serveFile(req, res, fullPath, stat);
    });
});

function startServer(port) {
    server.listen(port, () => {
        console.log('\n======================================================');
        console.log('🚀 RAKTechSoftHub Website Local Server is RUNNING!');
        console.log('======================================================');
        console.log(`🌐 Local URL:      http://localhost:${port}`);
        console.log(`🛡️  Admin Dashboard: http://localhost:${port}/login/admin/`);
        console.log(`📁 Serving Root:    ${PUBLIC_DIR}`);
        console.log('⚡ Video Streaming: Enabled (HTTP 206 Range Requests)');
        console.log('======================================================\n');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(PORT);
