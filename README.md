# Zeek Log Interactive Data Dictionary

An interactive data dictionary for [Zeek](https://zeek.org/) logs, designed to help analysts, engineers, and threat hunters understand the structure, relationships, and pivot points within Zeek's powerful telemetry.

<img width="1681" height="924" alt="Screenshot 2025-08-06 at 4 31 43 PM" src="https://github.com/user-attachments/assets/04e79e07-5250-4a55-be0b-1160b015cec1" />

---

## 🔍 Overview

Zeek generates rich, structured logs that provide deep insight into network activity — but working with them at scale can be daunting. This project delivers an **interactive data dictionary** that:

- Describes each Zeek log type, its fields, and field-level details (type, description, example values, etc.)
- Maps **relationships across logs** using shared identifiers and pivot keys (`uid`, `id.orig_h`, `id.resp_h`, etc.)
- Visualizes the **log hierarchy** and common pivot paths to accelerate investigations
- Enables quick lookup, cross-referencing, and exploration of logs in an intuitive UI

This tool is designed to reduce the learning curve and maximize the value of Zeek logs in security operations and data engineering workflows.

---

## ✨ Features

- 📖 Field-by-field descriptions of core Zeek logs (`conn.log`, `http.log`, `dns.log`, `ssl.log`, etc.)
- 🔗 Relationship maps across logs based on shared identifiers and keys
- 🧭 Pivot point identification to trace activity across logs
- 🌐 Interactive UI for exploring log structures and navigating across entries
- 📦 Easily extendable to support custom or derived Zeek logs



