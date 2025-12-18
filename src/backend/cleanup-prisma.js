
const fs = require('fs');
const path = 'd:\\Documentos\\Desenvolvimento\\Sistudo\\fitOS\\node_modules\\.prisma\\client\\query-engine-windows.exe';

try {
    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
        console.log('Deleted query-engine-windows.exe');
    } else {
        console.log('File not found');
    }
} catch (e) {
    console.error('Failed to delete:', e.message);
}
