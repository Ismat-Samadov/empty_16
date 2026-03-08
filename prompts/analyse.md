Analyze the provided dataset with a **strict focus on business value and decision-making insights**, rather than technical or statistical explanations.

Your deliverables must include the following components.

---

# 1. Charts Generation

Create visualizations that clearly communicate business insights.

Requirements:

* Create a directory named **`charts/`** where all generated charts will be saved.
* Implement a Python script named **`scripts/generate_charts.py`** that generates all visualizations automatically.
* The script must read data from the **`data/`** directory and output charts into **`charts/`**.
* Use only **business-appropriate chart types**, such as:

  * Bar charts
  * Line charts
  * Stacked bar charts
  * Area charts
  * Trend comparisons
* **Pie charts are strictly forbidden and must never be used.**
* Every chart must:

  * Display **clear axis labels**
  * Include **visible numeric values**
  * Use **readable titles explaining the business meaning**
  * Be designed for **presentation to stakeholders**

---

# 2. Insights and Findings

Identify insights that matter for **business strategy and decision-making**.

Focus on:

* Key trends
* Behavioral patterns
* Outliers or anomalies
* Performance differences between segments
* Growth or decline signals
* Risk indicators
* Operational inefficiencies
* Opportunities for optimization

Rules:

* Every **major insight must be supported by one or more charts**.
* Prioritize insights that can influence:

  * Strategy
  * Revenue growth
  * Cost reduction
  * Operational efficiency
  * Customer behavior understanding
  * Risk mitigation

Avoid:

* Statistical jargon
* Model explanations
* Data engineering descriptions

---

# 3. README Presentation Document

Create a **`README.md`** that serves as a **business presentation document**, not technical documentation.

The README must:

* Be written for **non-technical stakeholders**, such as:

  * Executives
  * Product managers
  * Business analysts
  * Strategy teams
* Focus on **what the results mean for the business**, not how the analysis was implemented.

For each section:

Explain clearly:

1. **What the chart shows**
2. **Why the finding matters**
3. **What decision or action could be taken**

Charts must be **embedded directly in the README** from the `charts/` folder so the document reads like a **visual insight report**.

---

# 4. Markdown Quality Requirements (Very Important)

The **README.md must be clean, readable, and free from formatting errors.**

Be especially careful to:

* Avoid **incorrect indentation**
* Avoid **broken Markdown lists**
* Avoid **misaligned bullet points**
* Ensure **consistent heading hierarchy**
* Ensure charts render correctly
* Maintain proper spacing between sections
* Use valid Markdown syntax

The README must look **professional, structured, and presentation-ready**.

---

# 5. Scope and Focus

The entire analysis must remain **strictly business-oriented**.

Do **NOT include**:

* Algorithm explanations
* Data preprocessing steps
* Code explanations
* Model training details
* Technical debugging information

Treat the README as a **final executive insight report**, suitable for **direct inclusion in a business presentation or leadership review**.