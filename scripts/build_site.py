"""Build an allowlisted public bundle; never publish repository/internal files."""
from pathlib import Path
import shutil, json, hashlib
root=Path(__file__).resolve().parents[1];out=root/'dist'
if out.exists():shutil.rmtree(out)
out.mkdir()
for pattern in ['*.html','styles.css','script.js','signup.js','how-to.css','how-to.js','apple-app-site-association','CNAME','.nojekyll']:
 for p in root.glob(pattern):shutil.copy2(p,out/p.name)
for name in ['assets','.well-known']:
 shutil.copytree(root/name,out/name,ignore=shutil.ignore_patterns('.DS_Store'))
# Keep verification metadata outside the public bundle.
print('Public bundle:',len(list(out.rglob('*'))),'entries')
