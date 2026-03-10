/**
 * Bitwrench v2 File I/O Functions
 *
 * Save/load files in both Node.js and browser environments.
 * Node uses fs module, browser uses Blob/XHR/FileReader.
 *
 * Called via bindFileOps(bw) which attaches all functions to the bw namespace.
 * This preserves the same public API (bw.saveClientFile, bw.loadClientFile, etc.)
 * while keeping the implementation in a separate module.
 *
 * @module bitwrench-file-ops
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

/**
 * Attach all file I/O functions to the bitwrench namespace.
 *
 * @param {Object} bw - Bitwrench namespace object
 */
export function bindFileOps(bw) {

  /**
   * Save data to a file. Works in both Node.js (fs.writeFile) and browser (download link).
   *
   * @param {string} fname - Filename to save as
   * @param {*} data - Data to save (string or buffer)
   * @category File I/O
   */
  bw.saveClientFile = function(fname, data) {
    if (bw.isNodeJS()) {
      bw._getFs().then(function(fs) {
        if (!fs) { console.error('bw.saveClientFile: fs module not available'); return; }
        fs.writeFile(fname, data, function(err) {
          if (err) {
            console.error("Error saving file:", err);
          }
        });
      });
    } else {
      var blob = new Blob([data], { type: "application/octet-stream" });
      var url = window.URL.createObjectURL(blob);
      var a = bw.createDOM({
        t: 'a',
        a: {
          href: url,
          download: fname,
          style: 'display: none'
        }
      });
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  /**
   * Save data as a JSON file with pretty formatting.
   *
   * @param {string} fname - Filename to save as
   * @param {*} data - Data to serialize as JSON
   * @category File I/O
   */
  bw.saveClientJSON = function(fname, data) {
    bw.saveClientFile(fname, JSON.stringify(data, null, 2));
  };

  /**
   * Load a file by path (Node.js) or URL (browser via XHR).
   *
   * @param {string} fname - File path (Node) or URL (browser)
   * @param {Function} callback - Called with (data, error). data is null on error.
   * @param {Object} [options] - Options
   * @param {string} [options.parser="raw"] - "raw" for string, "JSON" to auto-parse
   * @returns {string} "BW_OK"
   * @category File I/O
   */
  bw.loadClientFile = function(fname, callback, options) {
    var opts = { parser: 'raw' };
    if (options && options.parser) { opts.parser = options.parser; }
    var parse = (opts.parser === 'JSON') ? JSON.parse : function(s) { return s; };

    if (bw.isNodeJS()) {
      bw._getFs().then(function(fs) {
        if (!fs) { callback(null, new Error('fs module not available')); return; }
        fs.readFile(fname, 'utf8', function(err, data) {
          if (err) { callback(null, err); }
          else {
            try { callback(parse(data), null); }
            catch (e) { callback(null, e); }
          }
        });
      });
    } else {
      var x = new XMLHttpRequest();
      x.open('GET', fname, true);
      x.onreadystatechange = function() {
        if (x.readyState === 4) {
          if (x.status >= 200 && x.status < 300) {
            try { callback(parse(x.responseText), null); }
            catch (e) { callback(null, e); }
          } else {
            callback(null, new Error('HTTP ' + x.status + ': ' + fname));
          }
        }
      };
      x.send(null);
    }
    return 'BW_OK';
  };

  /**
   * Load a JSON file by path (Node.js) or URL (browser).
   *
   * @param {string} fname - File path (Node) or URL (browser)
   * @param {Function} callback - Called with (parsedData, error)
   * @returns {string} "BW_OK"
   * @category File I/O
   */
  bw.loadClientJSON = function(fname, callback) {
    return bw.loadClientFile(fname, callback, { parser: 'JSON' });
  };

  /**
   * Prompt user to pick a local file via file dialog (browser only).
   *
   * @param {Function} callback - Called with (data, filename, error)
   * @param {Object} [options] - Options
   * @param {string} [options.accept] - File type filter (e.g. ".json,.txt")
   * @param {string} [options.parser="raw"] - "raw" for string, "JSON" to auto-parse
   * @category File I/O
   */
  bw.loadLocalFile = function(callback, options) {
    var opts = { parser: 'raw', accept: '' };
    if (options) {
      if (options.parser) { opts.parser = options.parser; }
      if (options.accept) { opts.accept = options.accept; }
    }
    var parse = (opts.parser === 'JSON') ? JSON.parse : function(s) { return s; };

    if (bw.isNodeJS()) {
      callback(null, '', new Error('bw.loadLocalFile is browser-only. Use bw.loadClientFile() in Node.'));
      return;
    }

    var input = bw.createDOM({
      t: 'input',
      a: {
        type: 'file',
        accept: opts.accept,
        style: 'display: none'
      }
    });
    input.addEventListener('change', function() {
      var file = input.files[0];
      if (!file) { callback(null, '', new Error('No file selected')); return; }
      var reader = new FileReader();
      reader.onload = function(e) {
        try { callback(parse(e.target.result), file.name, null); }
        catch (err) { callback(null, file.name, err); }
      };
      reader.onerror = function() { callback(null, file.name, reader.error); };
      reader.readAsText(file);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  };

  /**
   * Prompt user to pick a local JSON file via file dialog (browser only).
   *
   * @param {Function} callback - Called with (parsedData, filename, error)
   * @category File I/O
   */
  bw.loadLocalJSON = function(callback) {
    bw.loadLocalFile(callback, { parser: 'JSON', accept: '.json' });
  };
}
