# Job Search AI Agent

A comprehensive AI-powered job search automation system built with n8n workflow automation platform.

## Project Overview

This project consists of three main AI agents designed to streamline job search and career development:

1. **Job Search Agent** - Automated job discovery and collection
2. **Resume Parser Agent** - Resume customization based on job descriptions
3. **Research Agent** - Academic and professional research automation

## Architecture Design

### Core Principles
- **Modular Design**: Each agent is independent and can be maintained separately
- **Unified Data Format**: All data sources output the same structure
- **Configuration-Driven**: Easy to add new data sources through configuration
- **Backward Compatible**: New features don't affect existing functionality

## Job Search Agent

### Purpose
Automatically collect job postings from multiple sources and store them in a unified Notion database.

### Data Sources
- **Gmail (LinkedIn Job Alerts)**: Primary source for job notifications
- **Indeed**: Web scraping for job postings
- **Glassdoor**: Company and salary information
- **AngelList**: Startup job opportunities
- **Company Career Pages**: Direct company job postings
- **Manual Input**: User-added job opportunities

### Workflow Architecture

```
Gmail Trigger (Real-time) → Gmail (Get Many) → Loop → Gmail (Get) → Code Parser → Notion
Schedule Trigger (Daily) → Indeed Scraper → Code Parser → Notion
Manual Input → Code Parser → Notion
```

### Gmail Integration Details

#### Workflow Node Configuration

| Node | Purpose | Configuration | Key Details |
|------|---------|---------------|-------------|
| **Gmail (Get Many)** | Retrieve email list | • Resource: Message<br>• Operation: Get Many<br>• Limit: 20<br>• Search: "newer_than:1d"<br>• Sender: "jobalerts-noreply@linkedin.com" | • AND relationship for filters<br>• Daily latest emails only<br>• Strict LinkedIn filtering<br>• Output: Email metadata array |
| **Loop** | Iterate through emails | • Input: Email array from Get Many<br>• Mode: Sequential<br>• Batch Size: 1 | • Processes each email individually<br>• Enables individual email processing<br>• Required for Gmail (Get) calls |
| **Gmail (Get)** | Get full email content | • Resource: Message<br>• Operation: Get<br>• Message ID: From Loop<br>• Format: Full | • Retrieves complete HTML content<br>• Required for job parsing<br>• 1 API call per email |
| **Code Parser** | Parse job information | • Language: JavaScript<br>• Input: Full email HTML<br>• Output: Structured job data | • Extracts job titles, companies, links<br>• Handles multiple jobs per email<br>• Deduplication logic |
| **Notion** | Store job data | • Database: Job Search Table<br>• Operation: Create<br>• Fields: Auto-mapped | • Unified job storage<br>• Extensible table structure<br>• Mix of auto/manual fields |

**Output Structure**:
```json
{
  "id": "19915f09235dcae4",
  "threadId": "1991439703dc91dc",
  "snippet": "View jobs in California",
  "subject": "30+ new jobs for strategic finance",
  "from": "LinkedIn Job Alerts <jobalerts-noreply@linkedin.com>",
  "to": "yixuanjing116@gmail.com",
  "date": "2025-01-02T07:17:00Z",
  "payload": {
    "mimeType": "multipart/alternative",
    "sizeEstimate": 164519,
    "historyId": 7644778,
    "internalDate": 1756860281000
  },
  "labels": ["INBOX", "CATEGORY_UPDATES", "UNREAD"]
}
```

**Limitations**:
- Only provides email preview (snippet), not full content
- Cannot extract specific job details from email body
- Limited to basic metadata and email structure information

#### Gmail (Get) Node
**Purpose**: Retrieve complete email content including HTML body
**Input**: Email ID from Gmail (Get Many)
**Output**: Full email content with HTML body

**Why Both Nodes Are Needed**:

**Gmail API Design**: Gmail API is divided into two operations:
- `messages.list` (Get Many): Retrieve email list
- `messages.get` (Get): Retrieve single email content

**Efficiency Considerations**:
- Retrieving 20 email list: 1 API call
- Retrieving 20 complete email contents: 20 API calls

**Quota Management**:
- Avoid unnecessary API calls
- Filter first, then retrieve detailed content

**Current Architecture is Optimal**:
- Gmail (Get Many): Fast retrieval of email list
- Gmail (Get): Complete content extraction for job parsing

### Data Processing Pipeline

#### 1. Email Collection
- **Gmail Trigger**: Real-time email monitoring
- **Gmail (Get Many)**: Batch email retrieval
- **Loop**: Iterate through each email
- **Gmail (Get)**: Extract full content

#### 2. Job Parsing
- **Code Node**: Parse HTML content
- **Extract**: Job titles, companies, locations, salaries, links
- **Transform**: Standardize data format
- **Deduplicate**: Remove duplicate entries

#### 3. Data Storage
- **Notion Integration**: Store in unified database
- **Fields**: Job Title, Company, Location, Salary, Link, Source, Date, Status

### Notion Database Schema

| Field | Type | Description |
|-------|------|-------------|
| Job Title | Title | Position name |
| Company | Text | Company name |
| Location | Text | Work location |
| Salary | Text | Salary range |
| Link | URL | Application link |
| Source | Select | Data source (Gmail/Indeed/Manual) |
| Date | Date | Discovery date |
| Status | Select | Application status |

## Resume Parser Agent

### Purpose
Customize resumes based on specific job descriptions using AI analysis.

### Features
- PDF/Word resume upload
- Job description analysis
- AI-powered customization suggestions
- Optimized resume generation

## Research Agent

### Purpose
Automate academic and professional research workflows.

### Capabilities
- Paper collection and analysis
- Data processing and simulation
- Results analysis and policy recommendations
- Multi-source data integration

## Technical Stack

- **Workflow Engine**: n8n
- **Database**: Notion
- **AI Integration**: Cursor AI (Pro)
- **Email Processing**: Gmail API
- **Web Scraping**: HTTP Request nodes
- **Data Processing**: JavaScript/Node.js

## Setup Instructions

### Prerequisites
- n8n instance (local or cloud)
- Gmail API credentials
- Notion API access
- Cursor Pro subscription

### Installation
1. Clone the repository
2. Configure n8n workflows
3. Set up API credentials
4. Test data flow

## Usage

### Daily Job Search
1. Gmail automatically collects LinkedIn job alerts
2. System parses job information
3. Data stored in Notion database
4. User reviews and applies

### Resume Customization
1. Upload resume and job description
2. AI analyzes requirements
3. Generate customized resume
4. Export optimized version

## API Rate Limits

### Gmail API Quota Details

| Quota Type | Limit | Our Usage | Status |
|------------|-------|-----------|---------|
| **Daily Requests** | 1,000,000 requests/day | ~50 requests/day | ✅ 0.005% of limit |
| **Rate Limit** | 100 requests/second | ~1 request/second | ✅ Well within limit |
| **Monthly Usage** | ~30,000,000 requests | ~2,500 requests | ✅ 0.008% of limit |
| **Annual Usage** | ~365,000,000 requests | ~30,000 requests | ✅ 0.008% of limit |

### Current Workflow Usage

| Operation | Frequency | Daily Calls | Monthly Calls |
|-----------|-----------|-------------|---------------|
| Gmail (Get Many) | 2 times/day | 2 calls | 60 calls |
| Loop (20 emails) | 2 times/day | 40 calls | 1,200 calls |
| Gmail (Get) | 2 times/day | 40 calls | 1,200 calls |
| **Total** | - | **82 calls** | **2,460 calls** |

### Quota Monitoring

- ✅ **Far below limit**: Usage is less than 0.1% of quota
- ✅ **Safety margin**: Sufficient buffer space for expansion
- ✅ **Scalable**: Can support additional data sources and features
- ✅ **Cost-effective**: No additional charges for current usage

## Security Considerations

- OAuth2 authentication for Gmail
- Secure credential storage
- Rate limiting to prevent abuse
- Data privacy compliance

## Future Enhancements

- Machine learning job matching
- Automated application submission
- Interview scheduling integration
- Salary negotiation insights
- Career progression tracking

## Contributing

This project is designed for personal use but can be extended for broader applications.

## License

Private project for personal career development.
