const { existsSync, writeFile, mkdir } = require("fs");
const { dirname } = require("path");

// Writes a file and parent directories recursively
module.exports.writeFileRecursive = function writeFileRecursive(file_path, data, overwrite = true) {
    // Get the directory path without the file
    const dirs = dirname(file_path);

    // If the folder path doesn't exist, write it recursively
    if(!existsSync(dirs))
        mkdir(dirs, { recursive: true }, err => {
            if (err) return console.error(err);
        });

    // If we are overwriting, just write the file
    if (overwrite)
        writeFile(file_path, data, err => {
            if (err) return console.error(err);
        });
    // If we aren't overwriting, check if it exists or write it
    else
        if (!existsSync(file_path))
            writeFile(file_path, data, err => {
                if (err) return console.log(err);
            });
        else return;
}
