"""
Minimal CircuitPython driver for ST25DV16K NFC/RFID EEPROM breakout.
Communicates via I2C to read/write user memory, parse NDEF records,
read dynamic registers (RF field detection), and read the UID.

No external dependencies beyond busio (built-in).
"""

import time

# I2C addresses (7-bit)
_USER_ADDR = 0x53    # User EEPROM + dynamic registers + mailbox
_SYSTEM_ADDR = 0x57  # System configuration registers

# Dynamic register addresses (accessed via _USER_ADDR)
_GPO_CTRL_DYN = 0x2000
_EH_CTRL_DYN = 0x2002
_RF_MNGT_DYN = 0x2003
_I2C_SSO_DYN = 0x2004
_IT_STS_DYN = 0x2005
_MB_CTRL_DYN = 0x2006
_MB_LEN_DYN = 0x2007

# System register addresses (accessed via _SYSTEM_ADDR)
_UID_ADDR = 0x0018
_MEM_SIZE_ADDR = 0x0014
_IC_REF_ADDR = 0x0017
_IC_REV_ADDR = 0x0020

# NDEF constants
_NDEF_TLV_TYPE = 0x03
_TERMINATOR_TLV = 0xFE

# URI prefix codes for NDEF URI records
_URI_PREFIXES = {
    0x00: "",
    0x01: "http://www.",
    0x02: "https://www.",
    0x03: "http://",
    0x04: "https://",
    0x05: "tel:",
    0x06: "mailto:",
    0x07: "ftp://anonymous:anonymous@",
    0x08: "ftp://ftp.",
    0x09: "ftps://",
    0x0A: "sftp://",
    0x0B: "smb://",
    0x0C: "nfs://",
    0x0D: "ftp://",
    0x0E: "dav://",
    0x0F: "news:",
    0x10: "telnet://",
    0x11: "imap:",
    0x12: "rtsp://",
    0x13: "urn:",
    0x14: "pop:",
    0x15: "sip:",
    0x16: "sips:",
    0x17: "tftp:",
    0x18: "btspp://",
    0x19: "btl2cap://",
    0x1A: "btgoep://",
    0x1B: "tcpobex://",
    0x1C: "irdaobex://",
    0x1D: "file://",
    0x1E: "urn:epc:id:",
    0x1F: "urn:epc:tag:",
    0x20: "urn:epc:pat:",
    0x21: "urn:epc:raw:",
    0x22: "urn:epc:",
    0x23: "urn:nfc:",
}

# NDEF TNF (Type Name Format) values
_TNF_EMPTY = 0x00
_TNF_WELL_KNOWN = 0x01
_TNF_MEDIA = 0x02
_TNF_ABSOLUTE_URI = 0x03
_TNF_EXTERNAL = 0x04
_TNF_UNKNOWN = 0x05

# Well-known record type names
_RTD_TEXT = 0x54     # 'T'
_RTD_URI = 0x55      # 'U'
_RTD_SMART_POSTER = 0x53  # 'Sp'


def _safe_decode(data, encoding="utf-8"):
    """Decode bytes to string, replacing errors with '?' since CircuitPython
    doesn't support the 'replace' error handler on .decode()."""
    try:
        return data.decode(encoding)
    except (UnicodeError, ValueError):
        # Fall back to byte-by-byte ASCII-safe decoding
        return "".join(chr(b) if 32 <= b < 127 else "?" for b in data)


class ST25DV16:
    """Driver for the ST25DV16K dual-interface NFC/RFID EEPROM."""

    def __init__(self, i2c):
        self._i2c = i2c
        self._user_addr = _USER_ADDR
        self._sys_addr = _SYSTEM_ADDR
        self._buf2 = bytearray(2)
        self.connected = False
        self._connect()

    def _connect(self):
        """Attempt to verify the device is present on I2C using bus scan."""
        while not self._i2c.try_lock():
            pass
        try:
            addrs = self._i2c.scan()
            self.connected = self._user_addr in addrs
        except OSError:
            self.connected = False
        finally:
            self._i2c.unlock()
        return self.connected

    def scan_bus(self):
        """Scan I2C bus and return list of detected addresses."""
        while not self._i2c.try_lock():
            pass
        try:
            return self._i2c.scan()
        finally:
            self._i2c.unlock()

    def try_reconnect(self):
        """Retry connection. Returns True if device is now available."""
        return self._connect()

    def _read_register(self, dev_addr, reg_addr, length=1):
        """Read length bytes from a 16-bit register address on given device."""
        while not self._i2c.try_lock():
            pass
        try:
            # Send 16-bit register address
            self._buf2[0] = (reg_addr >> 8) & 0xFF
            self._buf2[1] = reg_addr & 0xFF
            buf = bytearray(length)
            self._i2c.writeto_then_readfrom(dev_addr, self._buf2, buf)
            return buf
        finally:
            self._i2c.unlock()

    def _write_register(self, dev_addr, reg_addr, data):
        """Write data bytes to a 16-bit register address on given device."""
        while not self._i2c.try_lock():
            pass
        try:
            out = bytearray(2 + len(data))
            out[0] = (reg_addr >> 8) & 0xFF
            out[1] = reg_addr & 0xFF
            out[2:] = data
            self._i2c.writeto(dev_addr, out)
            time.sleep(0.006)  # EEPROM write cycle time
        finally:
            self._i2c.unlock()

    # ---- User memory read/write ----

    def read_user_memory(self, address, length):
        """Read bytes from user EEPROM area."""
        return self._read_register(self._user_addr, address, length)

    def write_user_memory(self, address, data):
        """Write bytes to user EEPROM area. Max 256 bytes per call."""
        self._write_register(self._user_addr, address, data)

    # ---- Dynamic registers ----

    def read_interrupt_status(self):
        """Read IT_STS_Dyn register. Clears on read.
        Returns dict with boolean flags for each interrupt source."""
        val = self._read_register(self._user_addr, _IT_STS_DYN, 1)[0]
        return {
            "rf_user": bool(val & 0x01),
            "rf_activity": bool(val & 0x02),
            "rf_interrupt": bool(val & 0x04),
            "field_falling": bool(val & 0x08),
            "field_rising": bool(val & 0x10),
            "rf_put_msg": bool(val & 0x20),
            "rf_get_msg": bool(val & 0x40),
            "rf_write": bool(val & 0x80),
            "raw": val,
        }

    def read_eh_status(self):
        """Read energy harvesting dynamic register."""
        val = self._read_register(self._user_addr, _EH_CTRL_DYN, 1)[0]
        return {
            "eh_on": bool(val & 0x01),
            "field_on": bool(val & 0x02),
            "vcc_on": bool(val & 0x04),
            "raw": val,
        }

    def read_mailbox_status(self):
        """Read mailbox control dynamic register."""
        val = self._read_register(self._user_addr, _MB_CTRL_DYN, 1)[0]
        return {
            "mb_enabled": bool(val & 0x01),
            "host_put_msg": bool(val & 0x02),
            "rf_put_msg": bool(val & 0x04),
            "host_miss_msg": bool(val & 0x10),
            "rf_miss_msg": bool(val & 0x20),
            "raw": val,
        }

    # ---- System configuration ----

    def read_uid(self):
        """Read the 8-byte unique identifier. Returns hex string."""
        uid = self._read_register(self._sys_addr, _UID_ADDR, 8)
        return ":".join("{:02X}".format(b) for b in uid)

    def read_memory_size(self):
        """Read total memory size in bytes."""
        data = self._read_register(self._sys_addr, _MEM_SIZE_ADDR, 2)
        blocks = (data[1] << 8) | data[0]
        return (blocks + 1) * 4  # Each block is 4 bytes

    def read_ic_ref(self):
        """Read IC reference code."""
        return self._read_register(self._sys_addr, _IC_REF_ADDR, 1)[0]

    def read_ic_rev(self):
        """Read IC revision."""
        return self._read_register(self._sys_addr, _IC_REV_ADDR, 1)[0]

    # ---- NDEF parsing ----

    def read_cc(self):
        """Read the 4-byte Capability Container."""
        cc = self.read_user_memory(0x0000, 4)
        magic = cc[0]
        version = (cc[1] >> 4) & 0x0F
        access = cc[1] & 0x0F
        mem_size = cc[2] * 8  # In bytes
        features = cc[3]
        return {
            "magic": magic,
            "valid": magic in (0xE1, 0xE2),
            "version": version,
            "access": access,
            "memory_size": mem_size,
            "features": features,
            "raw": list(cc),
        }

    def read_ndef_records(self):
        """Read and parse all NDEF records from user memory.
        Returns a list of parsed record dicts."""
        records = []

        # Read enough to get the TLV header
        # Start after the CC (4 bytes)
        offset = 4
        header = self.read_user_memory(offset, 3)

        # Walk TLV blocks
        while offset < 2048:
            tlv_type = header[0]

            if tlv_type == _TERMINATOR_TLV or tlv_type == 0x00:
                if tlv_type == _TERMINATOR_TLV:
                    break
                # Null TLV, skip
                offset += 1
                header = self.read_user_memory(offset, 3)
                continue

            # Get length
            if header[1] == 0xFF:
                # 3-byte length format
                length_data = self.read_user_memory(offset + 2, 2)
                tlv_len = (length_data[0] << 8) | length_data[1]
                data_offset = offset + 4
            else:
                tlv_len = header[1]
                data_offset = offset + 2

            if tlv_type == _NDEF_TLV_TYPE and tlv_len > 0:
                # Read the NDEF message payload
                ndef_data = self.read_user_memory(data_offset, min(tlv_len, 256))
                records.extend(self._parse_ndef_message(ndef_data, tlv_len))

            # Move past this TLV
            offset = data_offset + tlv_len
            if offset < 2048:
                header = self.read_user_memory(offset, 3)

        return records

    def _parse_ndef_message(self, data, total_len):
        """Parse NDEF records from raw message bytes."""
        records = []
        pos = 0

        while pos < total_len and pos < len(data):
            if pos >= len(data):
                break

            header_byte = data[pos]
            mb = bool(header_byte & 0x80)   # Message Begin
            me = bool(header_byte & 0x40)   # Message End
            cf = bool(header_byte & 0x20)   # Chunk Flag
            sr = bool(header_byte & 0x10)   # Short Record
            il = bool(header_byte & 0x08)   # ID Length present
            tnf = header_byte & 0x07        # Type Name Format
            pos += 1

            if pos >= len(data):
                break

            type_len = data[pos]
            pos += 1

            # Payload length
            if sr:
                if pos >= len(data):
                    break
                payload_len = data[pos]
                pos += 1
            else:
                if pos + 3 >= len(data):
                    break
                payload_len = (data[pos] << 24) | (data[pos+1] << 16) | (data[pos+2] << 8) | data[pos+3]
                pos += 4

            # ID length
            id_len = 0
            if il:
                if pos >= len(data):
                    break
                id_len = data[pos]
                pos += 1

            # Type field
            rec_type = bytes(data[pos:pos+type_len]) if type_len > 0 else b""
            pos += type_len

            # ID field
            rec_id = bytes(data[pos:pos+id_len]) if id_len > 0 else b""
            pos += id_len

            # Payload
            end = min(pos + payload_len, len(data))
            payload = bytes(data[pos:end])
            pos += payload_len

            record = self._decode_record(tnf, rec_type, payload, rec_id)
            records.append(record)

            if me:
                break

        return records

    def _decode_record(self, tnf, rec_type, payload, rec_id):
        """Decode a single NDEF record into a human-readable dict."""
        record = {
            "tnf": tnf,
            "type": _safe_decode(rec_type) if rec_type else "",
            "type_str": "",
            "payload_hex": " ".join("{:02X}".format(b) for b in payload),
            "payload_len": len(payload),
            "decoded": None,
            "record_kind": "unknown",
        }

        if rec_id:
            record["id"] = _safe_decode(rec_id)

        if tnf == _TNF_WELL_KNOWN and len(rec_type) == 1:
            rt = rec_type[0]

            if rt == _RTD_URI:  # 'U'
                record["type_str"] = "URI"
                record["record_kind"] = "uri"
                if len(payload) > 0:
                    prefix_code = payload[0]
                    prefix = _URI_PREFIXES.get(prefix_code, "")
                    uri_body = _safe_decode(payload[1:])
                    record["decoded"] = prefix + uri_body
                else:
                    record["decoded"] = ""

            elif rt == _RTD_TEXT:  # 'T'
                record["type_str"] = "Text"
                record["record_kind"] = "text"
                if len(payload) > 1:
                    status = payload[0]
                    lang_len = status & 0x3F
                    encoding = "utf-16" if (status & 0x80) else "utf-8"
                    lang = _safe_decode(payload[1:1+lang_len])
                    text = _safe_decode(payload[1+lang_len:], encoding)
                    record["decoded"] = text
                    record["language"] = lang
                else:
                    record["decoded"] = ""

            elif rt == _RTD_SMART_POSTER:  # 'Sp'
                record["type_str"] = "Smart Poster"
                record["record_kind"] = "smart_poster"
                # Smart Poster contains nested NDEF records
                nested = self._parse_ndef_message(payload, len(payload))
                record["decoded"] = nested

            else:
                record["type_str"] = _safe_decode(rec_type)

        elif tnf == _TNF_MEDIA:
            record["type_str"] = _safe_decode(rec_type)
            record["record_kind"] = "media"
            # Try to decode as text if it looks like text MIME type
            type_s = record["type_str"].lower()
            if "text" in type_s or "json" in type_s or "xml" in type_s:
                record["decoded"] = _safe_decode(payload)
            else:
                record["decoded"] = "[binary: {} bytes]".format(len(payload))

        elif tnf == _TNF_ABSOLUTE_URI:
            record["type_str"] = "Absolute URI"
            record["record_kind"] = "uri"
            record["decoded"] = _safe_decode(rec_type)

        elif tnf == _TNF_EXTERNAL:
            record["type_str"] = _safe_decode(rec_type)
            record["record_kind"] = "external"
            record["decoded"] = _safe_decode(payload)

        elif tnf == _TNF_EMPTY:
            record["type_str"] = "Empty"
            record["record_kind"] = "empty"
            record["decoded"] = ""

        else:
            record["type_str"] = "TNF={}".format(tnf)
            if payload:
                record["decoded"] = _safe_decode(payload)

        return record

    def read_raw_memory(self, start=0, length=64):
        """Read raw bytes from user memory. Useful for debugging."""
        data = self.read_user_memory(start, length)
        return {
            "start": start,
            "length": length,
            "hex": " ".join("{:02X}".format(b) for b in data),
            "bytes": list(data),
        }

    def get_tag_info(self):
        """Get a summary of the tag's identity and status."""
        uid = self.read_uid()
        mem = self.read_memory_size()
        ic_ref = self.read_ic_ref()
        ic_rev = self.read_ic_rev()
        cc = self.read_cc()
        eh = self.read_eh_status()

        return {
            "uid": uid,
            "memory_bytes": mem,
            "ic_ref": "0x{:02X}".format(ic_ref),
            "ic_rev": "0x{:02X}".format(ic_rev),
            "cc": cc,
            "energy_harvesting": eh,
        }
