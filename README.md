# Cloud Experiments 🧪☁️

A hands-on collection of AWS CDK labs designed to help developers learn cloud architecture and Infrastructure as Code (IaC) through practical experimentation.

## Purpose

Learning cloud development is best done through hands-on experience. I created this collection of cloud solutions that you can deploy, modify, and experiment with to deepen your understanding of:

- Cloud infrastructure patterns
- Serverless architectures  
- Infrastructure as Code
- AWS service integrations

## Experiments & Labs

Each experiment is designed as a self-contained learning module with its own README, architecture diagrams, and deployment instructions. Under each diagram, I provide a link to a written walkthrough where I discuss the solution and offer ideas to guide your experimentation.

### Available Experiments

> **Note**: I aim to add new labs regularly, so check back often for fresh content!

- **APIGatewayPattern**: Support an API using a variety of compute backends (Lambda and Containers)
- **APIGatewayWithLambdaAuthorization**: Use Lambda authorizers for adding a flexible authorization mechanism to an already-existing API Gateway REST API
- **APIGatewayWithProxiedRDS**: Use an RDS Proxy to securely manage connections from multiple Lambda functions to your RDS instance.
- **AutoEC2InstanceStartStop**: Use EventBridge scheduler rules, Lambda functions, and the AWS SDK to save money by starting and stopping EC2 instances based on a schedule
- **InventoryStockAlarm**: Use EventBridge scheduler rules, Lambda functions, and SNS topics to receive notifications when a product becomes available
- **LoadBalancedECSFargateFromPattern**: Implements a load-balaced ECS Fargate service using the AWS CDK ECS Patterns module
- **LoadBalancedECSFargateFromScratch**: Implements a load-balanced ECS Fargate service from scratch using standard constructs
- **ServerlessPdfContentModerationPipeline**: Leverage S3 event notifications, Lambda functions, and AWS Rekognition to generate moderation labels for individual PDF pages and detect potentially harmful content
- **ServerlessPdfProcessingPipeline**: Transform PDF files into different formats (PNG images and plain text) using S3 event notifications, Lambda functions, and AWS Textract
- **ServerlessPdfFullPipeline**: A combination of the previous two workflows that demonstrates the traditional SNS Fan-Out pattern by using SNS topics to distribute events across multiple processing pipelines

## Learning Tips

- **Start Small**: Once you understand CDK basics, begin writing your own experiments. Start simple and gradually increase complexity.

- **Experiment Safely**: Use separate AWS accounts for learning, and create a budget. Always check AWS pricing before deploying and remember to clean up resources after each session.

- **Understand the Code**: Don't just deploy—understand what each construct does and how it interacts with the overall solution.

- **Play, Break, and Document**: Learning happens when you modify things and observe what breaks. Keep notes of your discoveries and insights. This is especially helpful when inspiration strikes—write down your ideas and implement them later.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Experimenting! 🚀🧪**

Remember: The best way to learn cloud development is to build, break, and rebuild. Don't be afraid to experiment—that's what these labs are for!