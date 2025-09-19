# Intelligent Job Collection AI Agent


## 🎯 Project Objective

**Objective**: Automatically extract job listings from LinkedIn job alerts received via Gmail and synchronize them into a structured Notion database.

**Methods**:
- **Cursor as Pair Programmer**: Implement manual vibe coding functionality for rapid development and iteration
- **n8n Workflow Automation**: Integrate all components into a seamless pipeline, enabling twice-daily automated job collection

**Benefits**: Transform chaotic email notifications into a comprehensive positions database, allowing users to focus on the jobs themselves rather than manual data collection. This automation saves 10+ hours of searching, clicking, and organizing work, significantly improving job search efficiency.

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Job Collection System Architecture            │
└─────────────────────────────────────────────────────────────────┘

🔄 Method 1: Gmail Email Parsing (For Closed Platforms)
code┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gmail Alerts  │───▶│   n8n Workflow  │───▶│   Notion DB    
│                 │    │                 │    │                 │
│ • LinkedIn      │    │ • Gmail Nodes   │    │ • Job List      │
│ • Indeed        │    │ • Email Parser  │    │ • Deduplication │
│ • Glassdoor     │    │ • Notion Nodes  │    │ • Search        │
└─────────────────┘    └─────────────────┘    └─────────────────┘

🌐 Method 2: Direct Web Scraping (For Open Platforms)
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Direct Sites  │───▶│   n8n Workflow  │───▶│   Notion DB     │
│                 │    │                 │    │                 │
│ • Apple Jobs    │    │ • HTTP Request  │    │ • Job List      │
│ • Google Careers│    │ • Universal     │    │ • Deduplication │
│ • Greenhouse    │    │   Parser        │    │ • Search        │
│ • Workday       │    │ • Notion Nodes  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AI Services   │
                       │                 │
                       │ • LLM Analysis  │
                       │ • RAG Chat      │
                       │ • Resume Parser │
                       └─────────────────┘
```

### Progresses

**✅ Phase 1, Implemented**:
- **🤖 Job Collection Agent**: Fully operational LinkedIn job extraction from Gmail
- **📧 Gmail Integration**: Automated LinkedIn job alert processing
- **📝 Notion Integration**: Unified job database with intelligent deduplication
- **🔄 n8n Automation**: Reliable workflow orchestration and scheduling
- **🌐 Universal Parser**: Supports Apple, Google, Microsoft, Amazon, Meta, Netflix, Stripe
- **🔧 Platform Parsers**: Greenhouse, Workday, Lever, BambooHR, SmartRecruiters
- **📧 Email Parsers**: LinkedIn, Indeed, Glassdoor job alerts
- **Deduplication**: Intelligent conflict resolution with existing jobs

**🔄 Phase 2, In Development**:
- **🧠 LLM Reasoning**: AI-powered content analysis and job matching 
- **💬 Chat Interface**: Interactive job search assistant with RAG capabilities
- **📄 Resume Parser**: AI-powered resume customization and analysis


## 🔧 Technical Stack

- **Workflow Engine**: n8n
- **Database**: Notion
- **AI Integration**: Cursor AI (Pro)
- **Email Processing**: Gmail API
- **Job Parsing**: Universal JavaScript parsers (Apple, Google, Microsoft, Amazon, Meta, Netflix, Stripe, Greenhouse, Workday, Lever, BambooHR, SmartRecruiters, LinkedIn, Indeed, Glassdoor)
- **Data Processing**: JavaScript/Node.js
- **API Service**: Flask (Python)
- **Containerization**: Docker & Docker Compose (local execution only)
- **Infrastructure**: Multi-container orchestration with shared networking


### Core Principles

- **Modular Design**: Each agent is independent and can be maintained separately
- **Unified Data Format**: All data sources output the same structure
- **Configuration-Driven**: Easy to add new data sources through configuration
- **Backward Compatible**: New features don't affect existing functionality

### n8n Code Node Limitations

**Sandbox Environment**: n8n Code nodes run in a sandboxed environment with the following restrictions:
- **No Global State**: Cannot access global variables or maintain state across executions
- **No Persistence**: Each execution is isolated and cannot remember previous data
- **Limited Scope**: Cannot access system resources, files, or external APIs directly
- **Cross-Execution Deduplication**: Cannot implement true global deduplication across multiple workflow runs

**Impact on Job Collection**: 
- Deduplication only works within a single workflow execution
- Each workflow run starts with a clean state
- For persistent deduplication, consider alternative tools like Airbyte or custom scripts



## 🔧 Configuration

### Gmail Integration

#### Workflow Node Configuration

| Node | Purpose | Configuration | Key Details |
|------|---------|---------------|-------------|
| **Schedule Trigger (Morning)** | Daily morning execution | • Cron: "0 10 * * *" (10:00 AM)<br>• Timezone: Local<br>• Active: True | • Triggers Gmail collection<br>• Captures overnight job alerts<br>• First daily execution<br>• **Requires computer to be powered on** |
| **Schedule Trigger (Evening)** | Daily evening execution | • Cron: "0 20 * * *" (8:00 PM)<br>• Timezone: Local<br>• Active: True | • Triggers Gmail collection<br>• Captures afternoon job alerts<br>• Second daily execution<br>• **Requires computer to be powered on** |
| **Gmail (Get Many)** | Retrieve email list | • Resource: Message<br>• Operation: Get Many<br>• Limit: 20<br>• Search: "newer_than:1d"<br>• Sender: "jobalerts-noreply@linkedin.com" | • AND relationship for filters<br>• Daily latest emails only<br>• Strict LinkedIn filtering<br>• Output: Email metadata array |
| **Code (Time Converter)** | Convert timestamps | • Mode: Run Once for All Items<br>• Language: JavaScript<br>• Input: Email array with Unix timestamps | • **Critical for deduplication**: internalDate as unique identifier<br>• **Essential for testing**: Human-readable time format<br>• **Dual format**: Preserves original + adds readable format<br>• **Timezone handling**: Converts to America/New_York |
| **Loop** | Iterate through emails | • Input: Email array from Time Converter<br>• Mode: Run Once for Each Item<br>• Batch Size: 1 | • **Required for individual processing**: Gmail (Get) needs single email ID<br>• **Enables full content retrieval**: Each email processed separately<br>• **Prevents API overload**: Sequential processing vs batch |
| **Gmail (Get)** | Get full email content | • Resource: Message<br>• Operation: Get<br>• Message ID: From Loop<br>• Format: Full | • Retrieves complete HTML content<br>• Required for job parsing<br>• 1 API call per email<br>• **Important**: Does not preserve upstream fields like `readableDate` |
| **Code Parser** | Parse job information | • Language: JavaScript<br>• Input: Full email HTML<br>• Output: Structured job data | • Extracts job titles, companies, links<br>• Handles multiple jobs per email<br>• **Deduplication logic** |
| **Notion** | Store job data | • Database: Job Search Table<br>• Operation: Create<br>• Fields: Auto-mapped<br>• **Duplicate Check**: Job Title + Company | • Unified job storage<br>• Extensible table structure<br>• **Automatic deduplication** |

### Notion Integration

#### Database Schema

| Field | Type | Description | Auto/Manual |
|-------|------|-------------|-------------|
| Job Title | Title | Position name | Auto |
| Link | URL | Application link | Auto |
| Onsite/Remote/Hybrid | Select | Work type | Auto |
| Apply Date | Date | Application date | Manual |
| Status | Select | Application status | Manual |
| Re-apply | Checkbox | Re-application flag | Manual |

#### Critical Setup Steps

1. **Create Notion Integration**
   - Go to https://www.notion.so/my-integrations
   - Create new integration: "n8n Job Search AI Agent"
   - Select workspace: "Yixuan Jing's Notion HQ" (not Private)
   - Copy Internal Integration Secret

2. **Database Creation**
   - Create database in Notion with 6 fields as shown above
   - Convert simple table to database (not just a table)
   - Get database ID from URL: `https://notion.so/database-id`

3. **Access Permissions**
   - In integration settings, go to "Access" tab
   - Add database to "Manually selected" permissions
   - Ensure integration has access to the database

### Greenhouse Job Parser

#### Supported Job Board Types

The parser automatically detects and handles different job board formats:

- **Standard Greenhouse**: `boards.greenhouse.io/company`
- **Custom Greenhouse**: Company-specific implementations
- **LinkedIn Jobs**: For deduplication purposes
- **Generic Fallback**: For unknown formats

#### Database Schema Mapping

| Greenhouse Field | Notion Field | Type | Description |
|------------------|--------------|------|-------------|
| `title` | Job Title | Title | Job position title |
| `url` | Link | URL | Complete application URL |
| `location` | Onsite/Remote/Hybrid | Text | Work location |
| `company` | - | - | Company name (used for deduplication) |
| `department` | - | - | Department (used for filtering) |
| `type` | - | - | Employment type (used for filtering) |



## 📊 Performance & Monitoring

### API Rate Limits

#### Gmail API Quota Details

| Quota Type | Limit | Our Usage | Status |
|------------|-------|-----------|---------|
| **Daily Requests** | 1,000,000 requests/day | ~50 requests/day | ✅ 0.005% of limit |
| **Rate Limit** | 100 requests/second | ~1 request/second | ✅ Well within limit |
| **Monthly Usage** | ~30,000,000 requests | ~2,500 requests | ✅ 0.008% of limit |
| **Annual Usage** | ~365,000,000 requests | ~30,000 requests | ✅ 0.008% of limit |

#### Current Workflow Usage

| Operation | Frequency | Daily Calls | Monthly Calls |
|-----------|-----------|-------------|---------------|
| Schedule Triggers | 2 times/day (10:00 AM, 8:00 PM) | 2 triggers | 60 triggers |
| Gmail (Get Many) | 2 times/day | 2 calls | 60 calls |
| Loop (20 emails) | 2 times/day | 40 calls | 1,200 calls |
| Gmail (Get) | 2 times/day | 40 calls | 1,200 calls |
| **Total** | - | **82 calls** | **2,460 calls** |

### Deduplication Strategy

| Method | Criteria | Implementation | Benefits |
|--------|----------|----------------|----------|
| **Primary Key** | Job Title + Company | Notion database unique constraint | • Prevents exact duplicates<br>• Handles LinkedIn re-sends<br>• Database-level protection |
| **Content Hash** | Email content hash | Code Parser JavaScript logic | • Detects similar job postings<br>• Handles minor variations<br>• Application-level filtering |
| **Time Window** | 24-hour overlap | Gmail search "newer_than:1d" | • Natural deduplication<br>• Prevents old job re-processing<br>• Efficient API usage |

### Personal Usage Time Investment

For individual users, the time investment is minimal and practical:

- **New Parser Development**: 1-2 hours
  - Quick analysis of job board structure
  - Copy and modify existing parser template
  - Test and validate functionality
  - Deploy to n8n workflow

- **Regular Maintenance**: 30 minutes per month
  - Check if all parsers are working correctly
  - Verify data quality in Notion database
  - Clean up any duplicate entries
  - Update documentation if needed

- **Issue Resolution**: On-demand basis
  - Fix parsing issues when they occur
  - Update selectors when websites change
  - Troubleshoot n8n workflow problems
  - No complex monitoring or alerting needed

### Security Considerations

- OAuth2 authentication for Gmail
- Secure credential storage
- Rate limiting to prevent abuse
- Data privacy compliance



## 📁 Project Structure

### 🔧 Core n8n Workflow Files

| 📄 File | 🎯 Purpose | 🔗 Usage in n8n |
|---------|------------|-----------------|
| `job_parser.js` | Main job parsing logic | **Code Parser node** - extracts job details from LinkedIn emails |
| `time_converter.js` | Timestamp conversion utility | **Code (Time Converter) node** - converts Unix timestamps to readable format |
| `debug_gmail_get.js` | Gmail debugging tool | **Debug node** - inspects Gmail (Get) node output structure |
| `test_current_state.js` | State testing utility | **Test node** - validates current workflow state |
| `gmail_parser.js` | Legacy email parser | **Backup parser** - early version of email parsing logic |

### 🎯 Job Parser Files

| 📄 File | 🎯 Purpose | 🔗 Usage in n8n |
|---------|------------|-----------------|
| `universal_company_parser.js` | **Universal parser** | **Code node** - automatically detects and parses any company/platform |
| `apple_parser.js` | Apple job parser | **Code node** - extracts jobs from Apple career pages |
| `greenhouse_optimized.js` | Greenhouse job parser | **Code Parser node** - extracts jobs from Greenhouse job boards |
| `stripe_parser.js` | Stripe job parser | **Code node** - extracts jobs from Stripe custom job board |
| `notion_job_mapper.js` | Notion integration | **Code node** - maps job data to Notion database schema |
| `test_apple_parser.js` | Apple test suite | **Test node** - validates Apple parser functionality |
| `test_apple_integration.js` | Integration tests | **Test node** - end-to-end testing for Apple parser |
| `apple_job_filter_example.js` | Filter examples | **Code node** - job filtering and search examples |

### 🐍 API Service Files

| 📄 File | 🎯 Purpose | 📝 Description |
|---------|------------|----------------|
| `app.py` | Flask API service | Python web service for content analysis and file processing |
| `llm_rag_service.py` | LLM RAG service | AI-powered chat and analysis service |
| `requirements.txt` | Python dependencies | Flask, PyPDF2, BeautifulSoup4, pandas, matplotlib, plotly |

### 🐳 Deployment & Infrastructure

| 📄 File | 🎯 Purpose | 📝 Description |
|---------|------------|----------------|
| `Dockerfile` | Container configuration | Builds Python API service container with Flask |
| `docker-compose.yml` | Service orchestration | Multi-service setup: n8n, API, and LLM RAG services |
| `workflows/` | n8n workflow templates | Sample workflows for different use cases |
| `workflows/apple_job_collector.json` | Apple job collector | **n8n workflow** - automated Apple job collection |

### ⚙️ Configuration & Documentation

| 📄 File | 🎯 Purpose | 📝 Description |
|---------|------------|----------------|
| `config_backup.md` | Configuration backup | Contains all API credentials and settings (⚠️ **NOT in Git**) |
| `README.md` | Project documentation | Complete setup and usage guide |
| `LICENSE` | MIT License | Open source license |


## 🎛️ Build up in Cursor

### Prompts

#### 1) Connect Cursor (AI Agent) to this repo
- "Open the repository in Cursor and act as my Pair Programmer. Goal: build an LLM-powered job collection agent using n8n, Gmail API, and Notion. Keep code in English, minimal UI, and document steps in README."
- "Scan the codebase and summarize the workflow from Gmail → Parser → Notion. Identify integration points for a chat/RAG layer."
- "Generate a minimal Flask endpoint for `/chat` that accepts a question and returns a placeholder response. Add unit tests if trivial."

#### 2) n8n workflow bootstrapping
- "Create an n8n workflow: Webhook (POST /chat) → HTTP Request to my Flask `/chat` → Respond to Webhook. Return JSON { response, relevant_jobs, timestamp }."
- "Create a second webhook (POST /add-job) that forwards job JSON to my `/add_job` endpoint."
- "Export the workflow as JSON and save it under `workflows/llm_rag_chat.json`."

#### 3) Gmail API integration prompts
- "Guide me to create Gmail OAuth2 credentials. Output the exact steps and where to paste Client ID/Secret in n8n."
- "In n8n, configure Gmail (Get Many) to filter: sender `jobalerts-noreply@linkedin.com`, search `newer_than:1d`, limit 20."
- "Add a Code node using `time_converter.js`, then Loop → Gmail (Get) full message → Code `job_parser.js` → Notion. Ensure `emailTime` survives."

#### 4) Notion integration prompts
- "Walk me through creating a Notion integration and database. Fields: Job Title (Title), Link (URL), Onsite/Remote/Hybrid (Select/Rich Text)."
- "Map n8n Notion node properties exactly: Title = `={{ $json.jobTitle }}`, Link = `={{ $json.jobLink }}`, Work Type = `={{ $json.workType }}`."
- "Test with 3 sample items and verify entries appear in Notion without property errors."

#### 5) LLM + RAG chat layer (Phase 2)
- "Add `OPENAI_API_KEY` to env. Start the `llm_rag_service.py` on port 5001."
- "POST /add_job with a sample job. Then POST /chat with: 'Find remote data roles in SF Bay Area'. Confirm recommendations include the added job if relevant."
- "Serve `chat_interface.html` locally and test a full chat round-trip via n8n webhook."







## 🤖 AI Agents

### Phase 1: Job Collection Automation ✅ **IMPLEMENTED**

**Purpose**: Automatically collect job postings from multiple sources and store them in a unified Notion database.

**Implemented Features**:
- ✅ **Gmail Integration**: Successfully configured and tested
- ✅ **LinkedIn Job Alerts**: Automated extraction from Gmail (87 job entries processed)
- ✅ **Notion Integration**: Database connection and property mapping completed
- ✅ **End-to-End Workflow**: Complete automation pipeline operational
- ✅ **Greenhouse Parser**: Universal parser with smart deduplication
- ✅ **Custom Job Boards**: Stripe and other company-specific parsers
- ✅ **Deduplication**: Intelligent conflict resolution with existing jobs

**Data Sources**:
- **Gmail (LinkedIn Job Alerts)**: Primary source for job notifications ✅
- **Greenhouse**: Universal job board parser ✅
- **Custom Job Boards**: Stripe and other company-specific pages ✅
- **Manual Input**: User-added job opportunities ✅

### Phase 2: LLM Reasoning & Intelligence 🔄 **IN DEVELOPMENT**

**Purpose**: Add AI-powered reasoning, analysis, and intelligent job matching capabilities.

**Planned Features**:
- 🔄 **LLM Reasoning**: AI analysis of job requirements and candidate matching
- 🔄 **Intelligent Job Recommendations**: AI-powered job suggestions based on skills
- 🔄 **Resume Customization**: AI analysis and resume tailoring for specific jobs
- 🔄 **Chat Interface**: Interactive job search assistant with RAG capabilities
- 🔄 **Skills Matching**: Automatic skills extraction and job matching

**Current Status**: LLM reasoning layer is under development but not yet implemented.

### Phase 3: Advanced Features 📋 **PLANNED**

**Purpose**: Advanced career development and research automation.

**Planned Capabilities**:
- 📋 **Research Agent**: Academic and professional research automation
- 📋 **Company Intelligence**: Auto-fetch company information and insights
- 📋 **Application Tracking**: Track application status and follow-up reminders
- 📋 **Salary Analysis**: Market data and compensation insights

### Cancelled Features ❌ **NOT IMPLEMENTING**

**Events Integration**: Originally planned to integrate tech events and conferences, but due to API limitations and membership requirements, this feature has been cancelled for now.



## 🚀 Setup Instructions

### 📋 Prerequisites

- ✅ Docker and Docker Compose
- ✅ Gmail API credentials
- ✅ Notion API access
- ✅ Cursor Pro subscription

### 🐳 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/Apple008811/n8n-ai-agent-job-search.git
   cd n8n-ai-agent-job-search
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access n8n interface**
   - 🌐 Open http://localhost:5678
   - ⚙️ Complete n8n setup wizard

4. **Access API service**
   - 🔌 API available at http://localhost:5002
   - ❤️ Health check: http://localhost:5002/health

> ⚠️ **Important**: Docker containers run locally and require your computer to be powered on. The automated job collection (scheduled at 10:00 AM and 8:00 PM daily) will only execute when your computer is running and the containers are active. If your computer is shut down or in sleep mode, the scheduled tasks will not trigger.

### 🔧 Manual Setup (Alternative)

1. **Install n8n locally**
   ```bash
   npm install n8n -g
   n8n start
   ```

2. **Set up Python API service**
   ```bash
   pip install -r requirements.txt
   python app.py
   ```

3. **Configure API credentials**
   - 📧 Gmail OAuth2 credentials
   - 📝 Notion integration token
   - 💾 Update `config_backup.md` with your settings

### ⚙️ n8n Workflow Configuration

1. **Import workflow templates**
   - 📄 Use `workflows/` directory as reference
   - 🆕 Create new workflow for Job Search Agent

2. **Configure Code nodes**
   - 📋 Copy content from respective `.js` files
   - 🔄 Set node modes (Run Once for All Items vs Each Item)

3. **Set up API connections**
   - 📧 Gmail API (OAuth2)
   - 📝 Notion API (Token)
   - 🌐 HTTP Request nodes for external APIs

## 📖 Usage Guide

### Daily Job Search

1. **Automated Collection**: Gmail automatically collects LinkedIn job alerts
2. **Smart Parsing**: System parses job information using AI
3. **Data Storage**: Jobs stored in Notion database with deduplication
4. **User Review**: User reviews and applies to relevant positions

### Greenhouse Job Parser

#### Basic Usage

```javascript
const { parseGreenhouseJobs, searchGreenhouseJobs } = require('./greenhouse_optimized.js');

// Parse jobs from Greenhouse HTML
const jobs = parseGreenhouseJobs(html, 'Company Name');

// Search for specific jobs
const engineerJobs = searchGreenhouseJobs(jobs, { title: 'Engineer' });
const remoteJobs = searchGreenhouseJobs(jobs, { location: 'Remote' });
```

#### Notion Integration

```javascript
const { parseAndMapToNotion } = require('./notion_job_mapper.js');

// Parse and map to Notion format (with deduplication)
const notionPages = parseAndMapToNotion(html, 'Company Name', existingLinkedInJobs);
```

### Resume Customization

1. **Upload**: Upload resume and job description
2. **AI Analysis**: AI analyzes requirements and matches skills
3. **Generate**: Generate customized resume
4. **Export**: Export optimized version

## 📋 Standard Operating Procedure

### Overview

This SOP outlines the complete process for developing new job collection agents, from initial prompts to production deployment.

### Phase 1: Planning & Requirements

#### 1.1 Initial Prompt
Start with a clear, specific prompt that defines the scope and requirements:

```
"Create a [JOB_BOARD_TYPE] job parser that:
- Extracts job titles, locations, departments, and application URLs
- Integrates with existing Notion Job List database
- Prevents duplicates with existing LinkedIn jobs
- Supports advanced filtering and search
- Follows the established code patterns in this repository"
```

#### 1.2 Requirements Analysis
- **Data Source**: Identify the job board URL and structure
- **Data Fields**: Map required fields to Notion schema
- **Integration Points**: Define how it connects to existing systems
- **Deduplication**: Specify conflict resolution with existing data
- **Performance**: Set parsing speed and accuracy targets

#### 1.3 Create TODO List
Use the todo_write tool to track progress:

```javascript
todo_write({
  merge: false,
  todos: [
    { id: 'analyze_source', content: 'Analyze job board HTML structure and data format', status: 'in_progress' },
    { id: 'create_parser', content: 'Create specialized parser for the job board', status: 'pending' },
    { id: 'notion_mapping', content: 'Map parser output to Notion database schema', status: 'pending' },
    { id: 'deduplication', content: 'Implement duplicate detection against existing jobs', status: 'pending' },
    { id: 'testing', content: 'Create comprehensive test suite', status: 'pending' },
    { id: 'n8n_integration', content: 'Create n8n workflow for automation', status: 'pending' },
    { id: 'documentation', content: 'Update README with usage instructions', status: 'pending' }
  ]
});
```

### Phase 2: Code Development

#### 2.1 Parser Development
Create the core parsing logic:

```javascript
// File: [job_board]_parser.js
// 1. Analyze HTML structure
// 2. Implement multiple parsing methods (JSON, HTML, fallback)
// 3. Extract job data with error handling
// 4. Add comprehensive logging
// 5. Follow English-only code and comments rule
```

#### 2.2 Notion Integration
Create mapping functions:

```javascript
// File: notion_[job_board]_mapper.js
// 1. Map parser output to Notion schema
// 2. Implement deduplication logic
// 3. Handle data validation and cleaning
// 4. Add export functionality for manual import
```

#### 2.3 Testing Suite
Create comprehensive tests:

```javascript
// File: test_[job_board]_parser.js
// 1. Unit tests for parsing functions
// 2. Integration tests with Notion mapping
// 3. Deduplication tests with existing data
// 4. Error handling and edge case tests
// 5. Performance benchmarks
```

### Phase 3: n8n Configuration

#### 3.1 Workflow Design
Create the n8n workflow structure:

```json
{
  "name": "[Job Board] Job Collector",
  "nodes": [
    {
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "expression": "0 9 * * *"}]
        }
      }
    },
    {
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://[job-board-url]",
        "method": "GET"
      }
    },
    {
      "name": "Code - Parse Jobs",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const { parseJobs } = require('./[parser-file]');\nconst jobs = parseJobs($input.first().json.html, 'Company Name');\nreturn jobs.map(job => ({ json: job }));"
      }
    },
    {
      "name": "Notion - Create Page",
      "type": "n8n-nodes-base.notion",
      "parameters": {
        "operation": "create",
        "databaseId": "your-database-id",
        "properties": {
          "Job Title": "={{ $json.title }}",
          "Link": "={{ $json.url }}",
          "Onsite/Remote/Hybrid": "={{ $json.location }}"
        }
      }
    }
  ]
}
```

### Phase 4: Testing & Validation

#### 4.1 Unit Testing
Run individual component tests:

```bash
# Test parser functionality
node test_[job_board]_parser.js

# Test Notion integration
node test_notion_[job_board]_mapper.js

# Test deduplication
node test_deduplication.js
```

#### 4.2 Integration Testing
Test complete workflow:

```bash
# Test n8n workflow
n8n execute --workflow workflows/[job_board]_collector.json

# Test with real data
n8n execute --workflow workflows/[job_board]_test.json
```

### Phase 5: Documentation & Deployment

#### 5.1 Update README
Add comprehensive documentation with:
- Overview and features
- Installation instructions
- Usage examples
- Configuration options
- Testing instructions
- Troubleshooting guide

#### 5.2 Create Examples
Provide practical examples:
- Complete working examples
- Real-world usage scenarios
- Best practices demonstration

### Phase 6: Maintenance & Monitoring

#### 6.1 Monitoring Setup
- Set up logging for parsing success/failure rates
- Monitor Notion API usage and limits
- Track duplicate detection accuracy
- Monitor n8n workflow execution

#### 6.2 Regular Maintenance
- Weekly: Review parsing accuracy
- Monthly: Update parser for site changes
- Quarterly: Performance optimization
- As needed: Bug fixes and improvements

### Best Practices

#### Code Quality
- **English Only**: All code, comments, and documentation in English
- **Error Handling**: Comprehensive error handling and logging
- **Testing**: Unit tests for all functions
- **Documentation**: Clear, comprehensive documentation
- **Performance**: Optimize for speed and memory usage

#### Integration
- **Modularity**: Keep components independent and reusable
- **Configuration**: Use configuration files for easy updates
- **Validation**: Validate all data before processing
- **Deduplication**: Always check for duplicates
- **Security**: Follow security best practices


## 📋 Development Roadmap

### Phase 2: LLM Reasoning & Intelligence 🔄 **CURRENT FOCUS**
- [ ] **LLM Reasoning Engine** - Implement AI-powered job analysis and candidate matching
- [ ] **Chat Interface** - Interactive job search assistant with RAG capabilities
- [ ] **Resume Parser** - AI-powered resume customization and analysis
- [ ] **Skills Matching** - Automatic skills extraction and job matching
- [ ] **Job Recommendations** - AI-powered job suggestions based on profile

### Phase 3: Advanced Features 📋 **PLANNED**
- [ ] **Research Agent** - Academic and professional research automation
- [ ] **Company Intelligence** - Auto-fetch company information from Glassdoor/Crunchbase
- [ ] **Application Tracking** - Track application status and follow-up reminders
- [ ] **Salary Analysis** - Market data and compensation insights
- [ ] **Career Progression** - Long-term career development analytics

### Phase 4: Platform Expansion 🚀 **FUTURE**
- [ ] **Multi-platform Support** - Add Indeed, AngelList, GitHub Jobs, Stack Overflow Jobs
- [ ] **Advanced Filtering** - Filter jobs by keywords, location, salary range, company size
- [ ] **Machine Learning** - Learn from user preferences and application history
- [ ] **Automated Applications** - One-click application for compatible job boards
- [ ] **Interview Integration** - Calendar integration for interview management

### Improvements & Maintenance 🔧 **ONGOING**
- [ ] **Work Type Parsing** - Improve detection logic (currently extracting "Unknown")
- [ ] **Repository Rename** - Consider renaming from `job-search` to `job-collection-platform`
- [ ] **Performance Optimization** - Enhance parsing speed and accuracy
- [ ] **Error Handling** - Improve robustness and error recovery

### Cancelled Features ❌ **NOT IMPLEMENTING**
- **Events Integration** - Originally planned to integrate tech events and conferences, but due to API limitations and membership requirements, this feature has been cancelled for now

## 📋 Table of Contents

- [🎛️ Quick Start](#️-quick-start)
- [🏗️ Architecture](#️-architecture)
- [🤖 AI Agents](#-ai-agents)
- [🔧 Technical Stack](#-technical-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Setup Instructions](#-setup-instructions)
- [📖 Usage Guide](#-usage-guide)
- [📋 Standard Operating Procedure](#-standard-operating-procedure)
- [🔧 Configuration](#-configuration)
- [📊 Performance & Monitoring](#-performance--monitoring)
- [📋 Development Roadmap](#-development-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)



## 🤝 Contributing

This project is designed for personal use but can be extended for broader applications.

## 📄 License

Private project for personal career development.