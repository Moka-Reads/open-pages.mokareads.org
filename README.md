# Open Pages

The Open Pages initiative is an effort by MoKa Reads to develop research/academic papers that are open to the public and can be accessed freely.
We believe that open access will promote collaboration, remove barriers to knowledge and accelerate progress. We provide both PDFS to be freely downloaded
and a purchase link that will help support the initiative.

Our page is very simple, and uses `papers.json` to store information about the papers, which is managed by `manager.py` which includes a light weight GUI for managing the papers.

# How to Run

```bash
$ git clone https://github.com/Moka-Reads/open-pages.mokareads.org.git
$ cd open-pages.mokareads.org
$ python -m http.server
```
The website is now running on `http://localhost:8000`
