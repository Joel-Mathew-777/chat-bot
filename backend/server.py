from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader
# from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_objectbox.vectorstores import ObjectBox
from langchain_chroma import Chroma
from langchain_community.llms import Ollama
from langchain_community.memory.kg import ConversationKGMemory
from langchain.chains import create_retrieval_chain
from langchain.chains import RetrievalQA

from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

app = Flask(__name__)
CORS(app)

llm = Ollama(model="llama2")

# embeddings = OllamaEmbeddings()
embeddings = HuggingFaceBgeEmbeddings(model_name = "all-MiniLM-L6-v2")
context_store = {"url":''}

@app.route('/get-url', methods=['POST'])
def getUrl():
    """
    Endpoint to check if the provided URL matches the current stored URL in context_store.
    Expects JSON payload with 'url' field.
    """
    data = request.json
    url = data.get("url","")
    if url == context_store['url']:
       return jsonify({"match": "true"})
    return jsonify({"match": "false"})
     

@app.route('/start-chat', methods=['POST'])
def start_chat():
    """
    Endpoint to start a new chat session based on the provided URL.
    Expects JSON payload with 'url' field.
    """
    data = request.json
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "URL is required"}), 400
    print("Received URL:", url)

    # Clear existing context
    # ======================
    context_store.clear()
    context_store['url'] = url

    loader = WebBaseLoader(url)
    docs = loader.load()
    # defining the splitter parameters
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = 1000,
        chunk_overlap = 200,
        # length_function = len,
        # separators=["\n\n", "\n", " ", ""]
    )
    split_docs = text_splitter.split_documents(docs)
    print("Content retrieved from the website and splitted. Number of chunks", len(split_docs))

    # Prompt template for the retrieval chain 
    # =======================================
    prompt = ChatPromptTemplate.from_template("""The following is a conversation between a human and an AI. The AI ONLY uses information contained in the "context" section and does not hallucinate.
                                              <context>{context}</context>
                                              Question: {input}
                                              If you're not sure or the information is not in the context, say "I don't have enough information to answer that question accurately.""")
    
    # Create a new Objectbox database for each URL
    # ============================================
    # db = ObjectBox.from_documents(split_docs, embeddings, embedding_dimensions=768)
    db = Chroma.from_documents(split_docs, embeddings)

    retriever = db.as_retriever(search_kwargs={"k": 3})
    print("Retriever created.")
    context_store["retriever"] = retriever

    document_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, document_chain)
    
    print("Generating questions.")
    # Generate questions based on the content
    response = retrieval_chain.invoke({"input": "Generate 3 questions the user would like to ask from the given context. The output should only be questions, no need for answers or elaborations. format the questions in the following manner: start the questions with question 1, question 2, question 3"})

    # Create a new memory for each conversation
    # memory = ConversationKGMemory(llm=llm)

    print("Creating conversation chain.")
    conversation_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )
    # conversation_chain.combine_documents_chain.memory = memory

    context_store["conversation_chain"] = conversation_chain
    questions = []
    for question in response["answer"].split('\n'):
        if question.strip().startswith('Question'):
            cleaned_question = question.strip().split(': ', 1)[1]
            questions.append(cleaned_question)
    print("Returning questions.", questions)
    return jsonify({
        "message": "Conversational chain created",
        "chunk_count": len(split_docs),
        "suggested_questions": questions
    })

@app.route('/ask', methods=['POST'])
def ask():
    """
    Endpoint to handle incoming questions from the frontend.
    Expects JSON payload with 'question' field.
    """
    data = request.json
    question = data.get("question", "")
    if not question:
        return jsonify({"error": "Question is required"}), 400
    print('received question:',question)    
    conversation_chain = context_store["conversation_chain"]    
    response = conversation_chain.invoke(question)
    print("Answer generated! Sending the response")
    # print("Context taken from", response)
    return jsonify({"response": response["result"]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)