import { useState } from "react";
import { FileText, Bold, Italic, List, ListOrdered, Paperclip, Search, Download, Eye } from "lucide-react";
import { Textarea } from "@tower-guard/ui";
import { Badge } from "@tower-guard/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@tower-guard/ui";

interface Report {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  status: "published" | "draft";
}

const mockReports: Report[] = [
  { id: "r1", title: "Q1 2026 National Infrastructure Security Assessment", author: "John Adebayo", date: "2026-03-15", excerpt: "Comprehensive analysis of telecom mast security across all six geopolitical zones...", status: "published" },
  { id: "r2", title: "Borno State Critical Incident Response Report", author: "Amina Yusuf", date: "2026-03-12", excerpt: "Detailed incident response timeline for the Maiduguri mast breach on March 10...", status: "published" },
  { id: "r3", title: "South-South Zone Vandalism Trend Analysis", author: "Emeka Okafor", date: "2026-03-08", excerpt: "Analysis of increasing vandalism incidents across Rivers, Delta, and Bayelsa states...", status: "published" },
  { id: "r4", title: "Generator Fuel Theft Prevention Strategy", author: "Fatima Bello", date: "2026-02-28", excerpt: "Proposed countermeasures against systematic generator fuel siphoning at remote sites...", status: "published" },
  { id: "r5", title: "NSCDC Response Time Improvement Plan", author: "John Adebayo", date: "2026-02-20", excerpt: "Plan to reduce average first-responder dispatch time from 18 to 8 minutes...", status: "draft" },
];

const Reports = () => {
  const [tab, setTab] = useState<"create" | "published">("published");
  const [reportTitle, setReportTitle] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [search, setSearch] = useState("");
  const [formatting, setFormatting] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filteredReports = mockReports.filter(
    r => r.title.toLowerCase().includes(search.toLowerCase()) ||
         r.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!reportTitle.trim()) return;
    toast({
      title: "📄 Report Submitted",
      description: `"${reportTitle}" has been submitted for review.`,
    });
    setReportTitle("");
    setReportBody("");
    setTab("published");
  };

  const toggleFormat = (fmt: string) => {
    setFormatting(prev => {
      const next = new Set(prev);
      if (next.has(fmt)) next.delete(fmt);
      else next.add(fmt);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Reports</h1>
        <p className="text-[10px] text-muted-foreground italic">
          Some data may be restricted based on your user role.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("published")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "published" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Published Reports
        </button>
        <button
          onClick={() => setTab("create")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "create" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          + Create New Report
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "create" ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Create New Report</span>
            </div>

            {/* Title */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">
                Report Title
              </label>
              <input
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                placeholder="Enter report title..."
                className="w-full px-4 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Rich text toolbar */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">
                Report Body
              </label>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-1 px-3 py-2 bg-secondary/50 border-b border-border">
                  {[
                    { icon: Bold, id: "bold", label: "Bold" },
                    { icon: Italic, id: "italic", label: "Italic" },
                    { icon: List, id: "ul", label: "Bullet List" },
                    { icon: ListOrdered, id: "ol", label: "Numbered List" },
                    { icon: Paperclip, id: "attach", label: "Attachment" },
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => toggleFormat(btn.id)}
                      title={btn.label}
                      className={`p-1.5 rounded transition-colors ${
                        formatting.has(btn.id) ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <btn.icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={reportBody}
                  onChange={e => setReportBody(e.target.value)}
                  placeholder="Write your report content here..."
                  className="border-0 rounded-none min-h-[200px] focus-visible:ring-0 bg-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!reportTitle.trim()}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  reportTitle.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Submit Report
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="published"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel"
          >
            {/* Search */}
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Published Reports ({filteredReports.length})</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search reports..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-56"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">Report Title</th>
                    <th className="px-4 py-2.5 text-left font-medium">Author</th>
                    <th className="px-4 py-2.5 text-left font-medium">Date Published</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report.id} className="border-b border-border/30 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium">{report.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm truncate">{report.excerpt}</p>
                      </td>
                      <td className="px-4 py-3 text-secondary-foreground">{report.author}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{report.date}</td>
                      <td className="px-4 py-3">
                        <Badge variant={report.status === "published" ? "default" : "secondary"} className="text-[10px]">
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
