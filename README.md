# Job Search AI Agent

A comprehensive AI-powered job search automation system built with n8n workflow automation platform.

## Project Overview

This project consists of three main AI agents designed to streamline job search and career development:

1. **Job Search Agent** - Automated job discovery and collection ✅ **COMPLETED**
2. **Resume Parser Agent** - Resume customization based on job descriptions
3. **Research Agent** - Academic and professional research automation

## Current Status

### ✅ Job Search Agent - COMPLETED
- **Gmail Integration**: Successfully configured and tested
- **Email Processing**: 87 job entries extracted from LinkedIn alerts
- **Notion Integration**: Database connection and property mapping completed
- **Data Flow**: End-to-end workflow operational
- **Next Steps**: Configure dual schedule triggers (10:00 AM and 8:00 PM)

### 🔄 In Progress
- **Work Type Parsing**: Currently extracting "Unknown" - needs improvement
- **Schedule Triggers**: Need to configure morning and evening execution

### 📋 Pending
- **Resume Parser Agent**: Development pending
- **Research Agent**: Development pending

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
| **Schedule Trigger (Morning)** | Daily morning execution | • Cron: "0 10 * * *" (10:00 AM)<br>• Timezone: Local<br>• Active: True | • Triggers Gmail collection<br>• Captures overnight job alerts<br>• First daily execution |
| **Schedule Trigger (Evening)** | Daily evening execution | • Cron: "0 20 * * *" (8:00 PM)<br>• Timezone: Local<br>• Active: True | • Triggers Gmail collection<br>• Captures afternoon job alerts<br>• Second daily execution |
| **Gmail (Get Many)** | Retrieve email list | • Resource: Message<br>• Operation: Get Many<br>• Limit: 20<br>• Search: "newer_than:1d"<br>• Sender: "jobalerts-noreply@linkedin.com" | • AND relationship for filters<br>• Daily latest emails only<br>• Strict LinkedIn filtering<br>• Output: Email metadata array |
| **Code (Time Converter)** | Convert timestamps | • Mode: Run Once for All Items<br>• Language: JavaScript<br>• Input: Email array with Unix timestamps | • **Critical for deduplication**: internalDate as unique identifier<br>• **Essential for testing**: Human-readable time format<br>• **Dual format**: Preserves original + adds readable format<br>• **Timezone handling**: Converts to America/New_York |
| **Loop** | Iterate through emails | • Input: Email array from Time Converter<br>• Mode: Run Once for Each Item<br>• Batch Size: 1 | • **Required for individual processing**: Gmail (Get) needs single email ID<br>• **Enables full content retrieval**: Each email processed separately<br>• **Prevents API overload**: Sequential processing vs batch |
| **Gmail (Get)** | Get full email content | • Resource: Message<br>• Operation: Get<br>• Message ID: From Loop<br>• Format: Full | • Retrieves complete HTML content<br>• Required for job parsing<br>• 1 API call per email |
| **Code Parser** | Parse job information | • Language: JavaScript<br>• Input: Full email HTML<br>• Output: Structured job data | • Extracts job titles, companies, links<br>• Handles multiple jobs per email<br>• **Deduplication logic** |
| **Notion** | Store job data | • Database: Job Search Table<br>• Operation: Create<br>• Fields: Auto-mapped<br>• **Duplicate Check**: Job Title + Company | • Unified job storage<br>• Extensible table structure<br>• **Automatic deduplication** |

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

| Field | Type | Description | Auto/Manual |
|-------|------|-------------|-------------|
| Job Title | Title | Position name | Auto |
| Link | URL | Application link | Auto |
| Onsite/Remote/Hybrid | Select | Work type | Auto |
| Apply Date | Date | Application date | Manual |
| Status | Select | Application status | Manual |
| Re-apply | Checkbox | Re-application flag | Manual |

### Notion Integration Configuration

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

#### n8n Notion Node Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| **Credential** | Notion API (Token) | Use Internal Integration Secret |
| **Resource** | Database Page | For creating new entries |
| **Operation** | Create | Create new database entries |
| **Database** | By ID | Use database ID from URL |
| **Title** | `={{ $json.jobTitle }}` | Dynamic job title |
| **Properties** | See mapping below | Field-by-field configuration |

#### Property Mapping Configuration

| Notion Field | n8n Key Name | n8n Value | Mode |
|--------------|--------------|-----------|------|
| Link | Link | `={{ $json.jobLink }}` | Expression |
| Onsite/Remote/Hybrid | Onsite/Remote/Hybrid | `={{ $json.workType }}` | Expression |
| Apply Date | Apply Date | `={{ $json.emailTime }}` | Expression |
| Status | Status | `New` | Fixed |
| Re-apply | Re-apply | `""` | Fixed |

#### Common Issues and Solutions

| Issue | Error Message | Solution |
|-------|---------------|----------|
| **Wrong Workspace** | Integration not found | Select correct workspace in integration settings |
| **Page vs Database** | "is a page, not a database" | Convert table to database, get database ID |
| **Missing Permissions** | "Error fetching options" | Add database to integration access |
| **Property Mismatch** | "should be defined, instead was undefined" | Match exact property names from Notion |
| **Duplicate Title** | Title conflicts | Use Title field for page title, separate property for job title |

#### Database ID Extraction

**From Database URL:**
```
https://notion.so/2644ae56fb5a80229babdd248426236c?v=2654ae56fb5a8058bf55000cc593ea4c
```

**Database ID:**
```
2644ae56fb5a80229babdd248426236c
```

#### Testing and Validation

1. **Connection Test**: Green checkmark next to database name
2. **Property Detection**: Dropdown shows all database fields
3. **Data Flow Test**: 87 job entries successfully processed
4. **Error Resolution**: All property mapping errors resolved

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

## Configuration Backup

### Critical Configuration Files
- **`config_backup.md`**: Complete configuration backup with all credentials and settings (⚠️ **NOT in Git**)
- **`gmail_parser.js`**: Email parsing logic
- **`time_converter.js`**: Timestamp conversion logic
- **`job_parser.js`**: Job data extraction logic

### Backup Best Practices
1. **Always save Client Secret immediately after generation**
2. **Document all configuration changes in `config_backup.md`**
3. **Keep credential information secure and up-to-date**
4. **⚠️ NEVER commit credentials to Git or public repositories**
5. **Use `.gitignore` to exclude sensitive files**

### Development Best Practices
1. **Never delete working nodes without testing alternatives first**
2. **Add new nodes for testing, keep existing ones as backup**
3. **Compare outputs before making changes**
4. **Test thoroughly before replacing existing functionality**
5. **Maintain parallel workflows during development**

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
