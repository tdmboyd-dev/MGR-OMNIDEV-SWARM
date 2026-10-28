export const domains = ["Security","Backend","Frontend","DevOps","Cloud","Infrastructure","Databases","AI Development","Machine Learning","LLM Engineering","RAG Systems","Vector Databases","3D Development","Blender","Maya","Unity","Unreal Engine","Game Development","Mobile Development","Testing","QA","Automation","UI Design","UX Design","Accessibility","Compliance","Legal Auditing","Documentation","Research","Business Intelligence","Product Management","Customer Analytics","Revenue Optimization","Competitive Analysis","Innovation Discovery","Future Prediction","Architecture","Code Quality","Performance","Scalability","Reliability","Observability","Networking","Cyber Defense","Penetration Testing","Open Source Analysis","Dependency Intelligence"];
export const connectors = [
 ["GitHub","Code"],["GitLab","Code"],["Bitbucket","Code"],["Azure DevOps","Code"],["Local Projects","Code"],["Local Directories","Code"],["Monorepos","Code"],
 ["AWS","Cloud"],["Azure","Cloud"],["Google Cloud","Cloud"],["Digital Ocean","Cloud"],["Kubernetes","Infrastructure"],["Docker","Infrastructure"],
 ["PostgreSQL","Database"],["MySQL","Database"],["SQL Server","Database"],["MariaDB","Database"],["MongoDB","Database"],["Neo4j","Database"],["Redis","Database"],["Firebase","Database"],["Supabase","Database"],
 ["Figma","Design"],["Adobe XD","Design"],["Sketch","Design"],["Blender","3D"],["Maya","3D"],["Cinema4D","3D"],
 ["Notion","Knowledge"],["Confluence","Knowledge"],["Slack","Communication"],["Teams","Communication"],["Email Systems","Communication"],["Internal Documentation","Knowledge"],
 ["APIs","Systems"],["Microservices","Systems"],["Legacy Systems","Systems"],["ERP Systems","Business"],["CRM Systems","Business"]
];
export type RecordItem = {id:string;kind:string;title:string;projectId:string;status:string;data:any;createdAt:string;updatedAt:string};
export const exampleFiles = [
 {path:"package.json",content:JSON.stringify({name:"atlas-commerce",dependencies:{react:"^19.0.0",express:"^4.21.0",postgres:"^3.4.0"},scripts:{start:"node server.js"}},null,2)},
 {path:"src/api/orders.ts",content:'import { db } from "../db";\nexport async function createOrder(request) {\n const body = await request.json();\n return db.query("INSERT INTO orders VALUES (" + body.id + ")");\n}\nexport async function getOrders() { return db.query("SELECT * FROM orders"); }'},
 {path:"src/auth/session.ts",content:'export function session(token) {\n const user = JSON.parse(atob(token));\n return user;\n}\n// TODO: validate session expiration'},
 {path:"src/ui/checkout.tsx",content:'export function Checkout() { return <main><img src="product.jpg" /><input placeholder="Email" /><button>Pay now</button></main> }'},
 {path:"src/db.ts",content:'export const db = { query(sql) { return sql; } };'},
 {path:"infra/docker-compose.yml",content:'services:\n  api:\n    image: node:22\n    ports: ["3000:3000"]'}
];
