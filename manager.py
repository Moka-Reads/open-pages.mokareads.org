import json
import os
import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

JSON_FILE = "papers.json"

# Load and save papers
def load_papers():
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, "r") as f:
            return json.load(f)
    return []

def save_papers(papers):
    with open(JSON_FILE, "w") as f:
        json.dump(papers, f, indent=4)

# CLI functions
def list_papers(papers):
    for i, paper in enumerate(papers, start=1):
        print(f"{i}. {paper['title']} [{paper['status']}]")

def add_paper_cli(papers):
    title = input("Paper Title: ").strip()
    status = input("Status (working/idea/completed): ").strip().lower()
    tags = [t.strip() for t in input("Tags (comma-separated): ").split(",")]
    summary = input("Short summary: ").strip()
    abstract = input("Full abstract: ").strip()
    toc = [t.strip() for t in input("Table of Contents (comma-separated): ").split(",")]
    github = input("GitHub URL: ").strip()
    pdf = input("PDF URL: ").strip()
    purchase = input("Purchase URL: ").strip()
    papers.append({
        "title": title, "status": status, "tags": tags,
        "summary": summary, "abstract": abstract, "toc": toc,
        "github": github, "pdf": pdf, "purchase": purchase
    })
    save_papers(papers)
    print("Paper added!")

def update_status_cli(papers):
    list_papers(papers)
    choice = input("Select paper number to update status: ").strip()
    if choice.isdigit() and 1 <= int(choice) <= len(papers):
        idx = int(choice) - 1
        new_status = input("New status (working/idea/completed): ").strip().lower()
        papers[idx]["status"] = new_status
        save_papers(papers)
        print("Status updated!")
    else:
        print("Invalid selection.")

# GUI functions
class PaperManagerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Open Pages - Paper Manager")
        self.papers = load_papers()

        self.tree = ttk.Treeview(root, columns=("Status", "Tags"), show="headings")
        self.tree.heading("Status", text="Status")
        self.tree.heading("Tags", text="Tags")
        self.tree.pack(fill="both", expand=True)

        btn_frame = tk.Frame(root)
        btn_frame.pack(pady=5)
        tk.Button(btn_frame, text="Add Paper", command=self.add_paper_gui).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Update Status", command=self.update_status_gui).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Delete Paper", command=self.delete_paper_gui).pack(side="left", padx=5)

        self.refresh_tree()

    def refresh_tree(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        for paper in self.papers:
            self.tree.insert("", "end", values=(paper["title"], paper["status"], ", ".join(paper["tags"])))

    def add_paper_gui(self):
        title = simpledialog.askstring("Title", "Paper Title:")
        if not title: return
        status = simpledialog.askstring("Status", "Status (working/idea/completed):", initialvalue="working")
        tags = simpledialog.askstring("Tags", "Tags (comma-separated):")
        summary = simpledialog.askstring("Summary", "Short summary:")
        abstract = simpledialog.askstring("Abstract", "Full abstract:")
        toc = simpledialog.askstring("TOC", "Table of Contents (comma-separated):")
        github = simpledialog.askstring("GitHub", "GitHub URL:")
        pdf = simpledialog.askstring("PDF", "PDF URL:")
        purchase = simpledialog.askstring("Purchase", "Purchase URL:")

        self.papers.append({
            "title": title, "status": status.lower(),
            "tags": [t.strip() for t in tags.split(",")] if tags else [],
            "summary": summary, "abstract": abstract,
            "toc": [t.strip() for t in toc.split(",")] if toc else [],
            "github": github, "pdf": pdf, "purchase": purchase
        })
        save_papers(self.papers)
        self.refresh_tree()

    def update_status_gui(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Select Paper", "Please select a paper first.")
            return
        idx = self.tree.index(selected[0])
        new_status = simpledialog.askstring("Status", "New status (working/idea/completed):", initialvalue=self.papers[idx]["status"])
        if new_status:
            self.papers[idx]["status"] = new_status.lower()
            save_papers(self.papers)
            self.refresh_tree()

    def delete_paper_gui(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Select Paper", "Please select a paper first.")
            return
        idx = self.tree.index(selected[0])
        if messagebox.askyesno("Confirm Delete", f"Delete paper '{self.papers[idx]['title']}'?"):
            del self.papers[idx]
            save_papers(self.papers)
            self.refresh_tree()

# Main program
if __name__ == "__main__":
    choice = input("Run GUI? (y/n): ").strip().lower()
    if choice == "y":
        root = tk.Tk()
        app = PaperManagerGUI(root)
        root.mainloop()
    else:
        papers = load_papers()
        while True:
            print("\n--- Open Pages Paper Manager ---")
            print("1. List papers")
            print("2. Add new paper")
            print("3. Update paper status")
            print("4. Exit")
            opt = input("Choose an option: ").strip()
            if opt == "1":
                list_papers(papers)
            elif opt == "2":
                add_paper_cli(papers)
            elif opt == "3":
                update_status_cli(papers)
            elif opt == "4":
                break
            else:
                print("Invalid option!")
