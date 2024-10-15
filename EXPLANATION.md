# Motivation
This project automates the process of summarizing web pages, eliminating the need for manual summarization.

# Technical Challenges
- Some web pages may not follow best practices for semantic HTML, making content extraction harder.
- Handling pages with a lot of content can be resource-intensive.
- Managing a large number of concurrent users poses scaling and performance challenges.

# Technical Decisions
For this proof-of-concept, I chose AdonisJS v6 because it provides a solid foundation without requiring extensive configuration, allowing me to focus on the functional requirements.

I opted for PostgreSQL because it is well-supported in AdonisJS and provides robust data management.

 I chose TypeScript for its strong type system and IntelliSense support, which boosts development confidence and has first-class support in AdonisJS.

# User Stories
- As a user, I want to summarize a webpage by providing its URL, so that I can save time.
- As a user, I want to monitor the summarization process, so that I know its status.
- As a user, I want to retrieve a previously processed summary, so that I don't need to wait again.

# Architectural Decision in Production
In production, I plan to leverage cloud infrastructure, focusing on scalability, performance, and cost-efficiency. Here's the breakdown:

## API Gateway
All user requests will be routed through an API Gateway for validation and rate limiting.

### Load Balancer
A load balancer will distribute traffic to ensure high availability and resilience.
### Rate Limiting
As this API is public-facing, individual rate limits will be enforced.


## Modular architecture
I plan to split the core business logic into two microservices:
1. **Web Scraper Service**: This would be responsible for fetching the contents and chunking the contents from the supplied URL.
2. **Summarization Service**: Calls OpenAI's API for the content summarization.

## Using a message queue
After content is fetched, it will be passed to a message queue (Amazon MQ or SQS)

The queue handles requests asynchronously, allowing for scalable, non-blocking content processing.

The queue acts as a buffer to manage traffic spikes.

## Persistence Layer
I will use **DynamoDB** for scalable, low-latency storage.

## Caching
I will use Redis to cache the summary for the frequently accessed data

## Observability
CloudWatch for monitoring performance and system health
Alerts for high latency, errors, or service failures

## Cost optimization
Implement autoscaling and leveraging the openai's batch api endpoint

