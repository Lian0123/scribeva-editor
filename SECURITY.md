# Security policy

Please report suspected vulnerabilities privately to the project maintainers.
Do not include secrets, personal data, or active exploit payloads in public
issues.

Scribeva sanitizes imported HTML in the browser. Applications must still
validate authorization and sanitize untrusted HTML again on the server before
storing or rendering it.
