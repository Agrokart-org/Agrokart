import os
import glob
from langchain_community.document_loaders import TextLoader, DirectoryLoader, PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import Chroma

def get_embeddings():
    """
    Returns OpenAIEmbeddings if OPENAI_API_KEY is configured,
    else returns HuggingFaceEmbeddings / deterministic fallback.
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and not openai_key.startswith("sk-your"):
        try:
            from langchain_openai import OpenAIEmbeddings
            print("🔑 Using OpenAIEmbeddings (text-embedding-3-small)...")
            return OpenAIEmbeddings(model="text-embedding-3-small")
        except Exception as e:
            print(f"⚠️ OpenAI Embeddings Init Error: {e}. Falling back to HuggingFace Embeddings.")

    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        print("🤗 Using local HuggingFaceEmbeddings (all-MiniLM-L6-v2)...")
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    except Exception as e:
        print(f"⚠️ HuggingFace Embeddings fallback error: {e}")
        from langchain_community.embeddings import FakeEmbeddings
        return FakeEmbeddings(size=384)

def setup_vector_db(docs_dir="./data/agricultural_docs", chroma_dir="./chroma_db"):
    """
    Processes all PDF and TXT agricultural documents in docs_dir,
    splits them into chunks, creates embeddings, and saves to Chroma DB.
    """
    print("📚 Loading documents...")
    if not os.path.exists(docs_dir):
        os.makedirs(docs_dir, exist_ok=True)
        print(f"Created directory {docs_dir}")

    documents = []

    # Load TXT files
    try:
        txt_loader = DirectoryLoader(docs_dir, glob="*.txt", loader_cls=TextLoader)
        txt_docs = txt_loader.load()
        documents.extend(txt_docs)
        print(f"✓ Loaded {len(txt_docs)} TXT files")
    except Exception as e:
        print(f"⚠️ TXT Loader Note: {e}")

    # Load PDF files if present
    try:
        pdf_loader = DirectoryLoader(docs_dir, glob="*.pdf", loader_cls=PyPDFLoader)
        pdf_docs = pdf_loader.load()
        documents.extend(pdf_docs)
        print(f"✓ Loaded {len(pdf_docs)} PDF files")
    except Exception as e:
        print(f"⚠️ PDF Loader Note: {e}")

    if not documents:
        print("⚠️ No documents found! Creating default reference document.")
        default_file = os.path.join(docs_dir, "default_guide.txt")
        with open(default_file, "w") as f:
            f.write("Urea provides 46% Nitrogen. DAP provides 18% N and 46% P2O5. MOP provides 60% K2O.")
        txt_loader = DirectoryLoader(docs_dir, glob="*.txt", loader_cls=TextLoader)
        documents = txt_loader.load()

    print(f" Total document sections loaded: {len(documents)}")

    print("✂️ Splitting documents into chunks...")
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(documents)
    print(f"✓ Created {len(chunks)} chunks")

    print("🔤 Generating vector embeddings & writing to Chroma DB...")
    embeddings = get_embeddings()

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=chroma_dir
    )
    print(f"✓ Vector database successfully ready at '{chroma_dir}'!\n")
    return vector_store

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    setup_vector_db()
