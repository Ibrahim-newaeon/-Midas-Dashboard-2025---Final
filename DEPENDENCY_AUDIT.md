# Dependency Audit Report
**Date:** 2025-12-16
**Project:** Midas Furniture Dashboard
**Auditor:** Claude Code

---

## Executive Summary

This audit identified **6 unused packages** that can be removed (reducing bloat), **3 known security vulnerabilities** in system packages, and several packages that should be updated to more recent versions.

### Quick Stats
| Category | Count |
|----------|-------|
| Unused packages (remove) | 6 |
| Security vulnerabilities | 3 |
| Outdated packages | 5 |
| Packages OK as-is | 6 |

---

## 1. Security Vulnerabilities

### Critical/High Priority

| Package | Current | Vulnerability | Fixed In | Severity |
|---------|---------|---------------|----------|----------|
| cryptography | 41.0.7 | CVE-2024-0727, CVE-2023-50782, PYSEC-2024-225, GHSA-h4gh-qq45-vh27 | >=43.0.1 | HIGH |
| pip | 24.0 | CVE-2025-8869 | >=25.3 | MEDIUM |
| setuptools | 68.1.2 | CVE-2024-6345, PYSEC-2025-49 | >=78.1.1 | MEDIUM |

**Note:** `cryptography` is a transitive dependency (used by other packages). The pip and setuptools vulnerabilities are in system packages that should be updated in the deployment environment.

### Recommendations
```bash
# Update pip and setuptools in deployment environment
pip install --upgrade pip setuptools

# cryptography will be updated when dependencies are updated
```

---

## 2. Unused Packages (Bloat)

The following packages are listed in `requirements.txt` but are **not used anywhere in the codebase**:

| Package | Reason Unused | Estimated Size |
|---------|---------------|----------------|
| `matplotlib>=3.7.0` | Only Plotly is used for visualization | ~35 MB |
| `reportlab>=4.0.0` | PDF export mentioned but not implemented | ~4 MB |
| `xlsxwriter>=3.1.0` | Only `openpyxl` is used for Excel export | ~1 MB |
| `passlib>=1.7.4` | Only `bcrypt` is used for password hashing | ~0.5 MB |
| `python-dateutil>=2.8.0` | Standard `datetime` module is used throughout | ~0.3 MB |
| `requests>=2.31.0` | `facebook-business` SDK handles API calls internally | ~0.3 MB |

**Total potential savings:** ~41 MB (plus transitive dependencies)

### Evidence

```python
# matplotlib - Zero imports found
grep -r "matplotlib\|plt\." **/*.py  # No results

# reportlab - Only mentioned in docstring, not imported
export/data_exporter.py:3: "Handles export to CSV, Excel, and PDF formats"
# Actual code only implements CSV and Excel, no PDF

# xlsxwriter - Zero imports, openpyxl is used instead
export/data_exporter.py:31: engine='openpyxl'
pages/11_📤_Upload_Data.py:466: engine='openpyxl'

# passlib - Zero imports, bcrypt is used directly
database/db_setup.py:4: import bcrypt

# python-dateutil - Zero imports
# All date handling uses: from datetime import datetime, timedelta

# requests - Zero imports, facebook-business SDK used
app/data_integration/meta_api.py:15: from facebook_business.api import FacebookAdsApi
```

---

## 3. Outdated Packages

| Package | Current Min | Latest | Recommendation |
|---------|-------------|--------|----------------|
| `streamlit` | >=1.28.0 | 1.52.1 | Update to >=1.40.0 (requires Python >=3.10) |
| `plotly` | >=5.18.0 | 5.24.1 | Update to >=5.22.0 |
| `facebook-business` | >=17.0.0 | 24.0.1 | Update to >=22.0.0 |
| `scikit-learn` | >=1.3.0 | 1.6.0 | Update to >=1.4.0 |
| `scipy` | >=1.11.0 | 1.15.0 | Update to >=1.12.0 |

---

## 4. Packages Status Summary

### Keep As-Is (Good)
- `pandas>=2.0.0` - Current version adequate
- `numpy>=1.24.0` - Current version adequate
- `openpyxl>=3.1.0` - Current version adequate
- `sqlalchemy>=2.0.0` - Current version adequate
- `bcrypt>=4.0.0` - No known vulnerabilities
- `faker>=20.0.0` - Current version adequate
- `joblib>=1.3.0` - Current version adequate

### Update Recommended
- `streamlit>=1.40.0` - Better performance and new features
- `plotly>=5.22.0` - Bug fixes and improvements
- `facebook-business>=22.0.0` - API compatibility improvements
- `scikit-learn>=1.4.0` - Performance improvements
- `scipy>=1.12.0` - Bug fixes

### Remove (Unused)
- `matplotlib>=3.7.0`
- `reportlab>=4.0.0`
- `xlsxwriter>=3.1.0`
- `passlib>=1.7.4`
- `python-dateutil>=2.8.0`
- `requests>=2.31.0`

---

## 5. Updated requirements.txt

See `requirements.txt` for the optimized dependency list with:
- Unused packages removed
- Version constraints updated
- Security-conscious versioning

---

## 6. Version Pinning Strategy

### Current Issues
- Using `>=` minimum versions without upper bounds can lead to breaking changes
- No lockfile (requirements.lock or similar) for reproducible builds

### Recommendations
1. **For Streamlit Cloud:** Keep flexible versioning (current approach works)
2. **For production:** Consider generating a `requirements.lock` file:
   ```bash
   pip freeze > requirements.lock
   ```
3. **For stability:** Consider compatible release operators:
   ```
   streamlit~=1.40.0  # Allows 1.40.x but not 1.41.0
   ```

---

## 7. Python Version Compatibility

**Current:** Python 3.8+
**Recommendation:** Update to Python 3.10+

### Reasons:
- Streamlit 1.40+ requires Python >=3.10
- Better performance and security
- End-of-life: Python 3.8 reached EOL in October 2024

---

## 8. Action Items

### Immediate (Security)
- [ ] Update `pip` and `setuptools` in deployment environment
- [ ] Verify `cryptography` is updated transitively

### Short-term (Bloat Reduction)
- [x] Remove unused packages from requirements.txt
- [ ] Test application after dependency changes
- [ ] Deploy and verify functionality

### Medium-term (Maintenance)
- [ ] Consider implementing PDF export with reportlab (if needed)
- [ ] Update Python version requirement to 3.10+
- [ ] Set up automated dependency vulnerability scanning (e.g., Dependabot)

---

## References

- [Streamlit PyPI](https://pypi.org/project/streamlit/)
- [Streamlit 2025 Release Notes](https://docs.streamlit.io/develop/quick-reference/release-notes/2025)
- [facebook-business PyPI](https://pypi.org/project/facebook-business/)
- [CVE Details - Python Cryptography](https://www.cvedetails.com/product/67541/Cryptography-Python-cryptography.html)
