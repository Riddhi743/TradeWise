"""Run from backend/ with venv active:  python -m app.ml.eval_sentiment"""
from datasets import load_dataset
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from collections import Counter
from .sentiment import score_texts

# Parquet-based copies of Financial PhraseBank (the original script-based one fails on new `datasets`)
CANDIDATES = [
    "FinanceInc/auditor_sentiment",
    "atrost/financial_phrasebank",
    "nickmuchi/financial-classification",
]
N = 1000
LABELS = ["negative", "neutral", "positive"]


def load_any():
    last_err = None
    for name in CANDIDATES:
        try:
            ds_dict = load_dataset(name)
            split = "test" if "test" in ds_dict else ("validation" if "validation" in ds_dict else "train")
            return name, ds_dict[split]
        except Exception as e:
            last_err = e
            print(f"[skip] {name}: {type(e).__name__}")
    raise RuntimeError(f"No dataset could be loaded. Last error: {last_err}")


name, ds = load_any()
print("Dataset:", name, "| rows:", len(ds), "| columns:", ds.column_names)

text_col = next(c for c in ("sentence", "text", "Sentence", "Text") if c in ds.column_names)
label_col = next(c for c in ("label", "labels", "Sentiment", "sentiment") if c in ds.column_names)

feat = ds.features[label_col]
names = [n.lower() for n in feat.names] if hasattr(feat, "names") else None
print("Label mapping:", names)

ds = ds.shuffle(seed=42).select(range(min(N, len(ds))))
texts = list(ds[text_col])
raw = list(ds[label_col])

ID2LABEL = {0: "negative", 1: "neutral", 2: "positive"}
y_true = [ID2LABEL[r] if isinstance(r, int) else str(r).lower() for r in raw]
print("Raw label counts:", Counter(raw))

y_pred = []
for i in range(0, len(texts), 32):
    y_pred += [r["label"] for r in score_texts(texts[i:i + 32])]

print(f"\nSamples  : {len(y_true)}")
print("Accuracy :", round(accuracy_score(y_true, y_pred), 4))
print("Macro F1 :", round(f1_score(y_true, y_pred, average="macro", labels=LABELS), 4))
print("\nConfusion matrix (rows=true, cols=pred, order: neg, neu, pos)")
print(confusion_matrix(y_true, y_pred, labels=LABELS))
print("\n", classification_report(y_true, y_pred, labels=LABELS, digits=3))