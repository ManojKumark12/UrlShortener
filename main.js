import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import { createServer } from "http";
import { extname, join } from "path";
import crypto from "crypto";

const DATA_FILE = join("data", "links.json");

// Function to serve files
const showData = async (filepath, contentType, res) => {
    try {
        const data = await readFile(filepath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Error: File Not Found");
    }
};

// Load links from JSON file
const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8");
           // Check if the file is empty
           if (!data.trim()) {
            await writeFile(DATA_FILE, JSON.stringify({}), "utf-8"); // Fix it
            return {};
        }
        return JSON.parse(data);
    } catch (err) {////////////////////////////////////////////////////////////////////////learn
        if (err.code === "ENOENT") {
            await writeFile(DATA_FILE, JSON.stringify({}), "utf-8");
            return {};
        }
        throw err;
    }
};

// Save links to JSON file
const saveLinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links), "utf-8");
};

const server = createServer(async (req, res) => {
    if (req.method === "GET") {////////////////////////////////////////////////////////////////////////////
        let filePath = req.url === "/" ? "index.html" : req.url.substring(1);
        let contentType = "text/html";
// console.log(filePath);
        const extension = extname(filePath);
        if(req.url==='/links'){
            const links=await loadLinks();
            // console.log(links);
            res.writeHead(200, { "Content-Type": "application/json" });
            // console.log("ha");
            return res.end(JSON.stringify(links));
        }
        // console.log(extension);
        if(!extension){
            const links=await loadLinks();
            if(links[filePath]){
                res.writeHead(302,{location:links[filePath]});
                return res.end();
            }
            else{
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Not Found" }));
            }
        }
        switch (extension) {
            case ".css":
                contentType = "text/css";
                break;
            case ".js":
                contentType = "application/javascript";
                break;
            case ".png":
                contentType = "image/png";
                break;
            case ".jpg":
            case ".jpeg":
                contentType = "image/jpeg";
                break;
            case ".svg":
                contentType = "image/svg+xml";
                break;
            default:
                contentType = "text/html";
        }
      

        showData(filePath, contentType, res);////////////////////////////////////////////////////
        return;
    }

    if (req.method === "POST" && req.url === "/shorten") {
        
        const links = await loadLinks();
        let body = "";

        req.on("data", (chunk) => {//////////////////////////////////////////how
            body += chunk;
        });

        req.on("end", async () => {
            const { url, shortCode } = JSON.parse(body);

            if (!url) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "URL is required" }));
            }

            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
            if (links[finalShortCode]) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Short code already exists" }));
            }
            
            links[finalShortCode] = url;
            await saveLinks(links);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, shortcode: finalShortCode }));
        });
    }
    
});

// Start server
server.listen(3000, () => {
    console.log("Listening at port 3000");
});
