# Third-party notices

Parts of this service were adapted from
[`rag-search-ingestion-langchainjs-gemini`](https://github.com/glaucia86/rag-search-ingestion-langchainjs-gemini),
originally authored by **Glaucia Lemos** and distributed under the MIT License.

Specifically, the following pieces were used as a starting point and have been
refactored to suit the Ouvidoria UESPI use case:

- the PDF ingestion pipeline (LangChain `PDFLoader` + `RecursiveCharacterTextSplitter` + `PGVectorStore`);
- the semantic retrieval / RAG prompt template structure;
- the Google Gemini embeddings adapter.

The original license notice is reproduced below in full.

---

## Original MIT License

```
MIT License

Copyright (c) 2025 Glaucia Lemos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
