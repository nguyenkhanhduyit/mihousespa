import { execute, closePool } from "../src/db.js";
await execute("DELETE FROM table_contact WHERE fullname = ?", ["Nguyễn Test Click"]);
await execute("DELETE FROM table_contact WHERE fullname = ?", ["Khách test CRUD"]);
await execute("DELETE FROM table_contact WHERE fullname = ?", ["Người test"]);
const r = await execute("SELECT COUNT(*) c FROM table_contact");
console.log("Đã xoá dữ liệu test. Còn lại:", r[0].c, "lượt liên hệ");
await closePool();
