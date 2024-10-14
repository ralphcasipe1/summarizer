# Motivation
This would ease out the need to manually summarize the content of the page.

# Technical Challenges
- If the webpage does not follow the best practices for writing good semantics in HTML
- When there's a lot of content in the web page
- When there huge number of concurrent users

# Technical Decisions
In this proof-of-concept, I chose to use the framework, AdonisJS v6. It gives me the headstart by not tweaking configurations and focus more on the functional requirements.

I chose to use the Postgres as my database because it is the first support from the AdonisJS Framework

I chose to deal with TypeScript because it gives me confidence because of it's intellisense and it has the first-class support from AdonisJS


# User Stories
- As a user, I want to summarize the page given just the URL provided, so that it would save me time.
- As a user, I want to monitor the status of summarization process, so that I am aware of it's status.
- As a user, I want to retrive the processed summary, so that I would not wait longer when the summary is already previously processed.

# Architectural Decision in Production
In production, I will leverage the advantages of using cloud providers. Let's take the example of using AWS.

1. The user's request will go through the API Gateway. This would help validate the request, do the **rate limiting**
   1. In this regard, we will also need a load balancer to distribute the traffic
   2. per user rate limiting: since this api is a public-facing api
2. I will move out from the AdonisJS and split the core business logic into two services, namely:
   1. **Web Scraper Service**: This would be responsible for fetching the contents and chunking the contents from the supplied URL.
   2. **Summarization Service**: Calls OpenAI's API for the content summarization.
3. Queueing the content processing: After fetching the content, we're going to pass this to a message queue:
   1. Use Amazon MQ or SQS
      1. This would process the incoming requests asynchronously
      2. The queue would also serve as a buffer time, which is helpful for dealing with sudden spikes in traffic
4. Observability
   1. Use cloud watch
   2. alerts: for high latency, errors, or service failures
   3. auto-healing: leverage auto-healing mechanisms like restart failed, containers, to maintain system uptime
5. persistence layer
   1. dynamodb
6. caching
   1. redis
7. cost optimization
   1. autoscaling based on demand

