from pathlib import Path
import json,csv,hashlib,urllib.request,re,html
from sklearn.feature_extraction.text import TfidfVectorizer,ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity
P=Path(__file__).resolve().parents[1]
URL='https://raw.githubusercontent.com/Eric-Miao/INFO251-Job_Scam_Detection/main/Data/emscad_v1.csv'
raw=P/'data/emscad_v1.csv'
if not raw.exists():urllib.request.urlretrieve(URL,raw)
sha=hashlib.sha256(raw.read_bytes()).hexdigest()
if sha!=(P/'data/SHA256.txt').read_text().split()[0]:raise ValueError('Dataset hash mismatch')
docs=list(dict.fromkeys(re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',' '.join(row[k] for k in ['title','description','requirements','benefits'])))).strip().lower()[:20000] for row in csv.DictReader(raw.open()) if row['fraudulent']=='f'))
docs=[d for d in docs if len(d)>=40]
vec=TfidfVectorizer(token_pattern=r'(?u)\b\w\w+\b',ngram_range=(1,2),sublinear_tf=True,stop_words='english',max_features=12000,min_df=3).fit(docs)
(P/'models/model.json').write_text(json.dumps({'kind':'frozen-tfidf-cosine','stopWords':sorted(ENGLISH_STOP_WORDS),'vocabulary':{k:int(v) for k,v in vec.vocabulary_.items()},'idf':vec.idf_.tolist(),'corpus_rows':len(docs),'dataset':'Real legitimate EMSCAD job descriptions,2012-2014, deduplicated plain text','source':URL,'sha256':sha,'note':'Cosine lexical similarity, not hiring probability; corpus labels are used only to choose legitimate posts, not train a match classifier. No match accuracy metric.'}))
a='python sql pandas machine learning react git';b='python sql docker aws statistics machine learning'
(P/'tests/parity.json').write_text(json.dumps({'resume':a,'job':b,'expected':float(cosine_similarity(vec.transform([a]),vec.transform([b]))[0,0])}))
print('Real legitimate EMSCAD TF-IDF corpus:',len(docs))
