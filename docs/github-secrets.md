# GitHub Secrets Configuration

This document outlines the required secrets for the FitOS GitHub Actions CI/CD pipeline.

## Required Secrets

### Docker Registry
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password or access token

### Staging Environment
- `STAGING_HOST`: Staging server hostname (e.g., staging.fitOS.com)
- `STAGING_USERNAME`: SSH username for staging server
- `STAGING_SSH_KEY`: Private SSH key for staging server access

### Production Environment
- `PROD_HOST`: Production server hostname (e.g., fitOS.com)
- `PROD_USERNAME`: SSH username for production server
- `PROD_SSH_KEY`: Private SSH key for production server access

### Database
- `DATABASE_URL`: PostgreSQL connection string for production
- `TEST_DATABASE_URL`: PostgreSQL connection string for testing

### Redis
- `REDIS_URL`: Redis connection string for production
- `TEST_REDIS_URL`: Redis connection string for testing

### JWT
- `JWT_SECRET`: Secret key for JWT token signing (use a strong, random string)

### External APIs
- `STRIPE_SECRET_KEY`: Stripe secret key for payments
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `MERCADOPAGO_ACCESS_TOKEN`: Mercado Pago access token
- `MERCADOPAGO_PUBLIC_KEY`: Mercado Pago public key
- `MERCADOPAGO_WEBHOOK_SECRET`: Mercado Pago webhook secret

### Email
- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password
- `EMAIL_FROM`: From email address

### Monitoring
- `SENTRY_DSN`: Sentry DSN for error tracking
- `PROMETHEUS_ENABLED`: Enable Prometheus monitoring (true/false)

## How to Add Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret with the exact name and value

## Security Notes

- Never commit secrets to the repository
- Use strong, unique passwords for all services
- Rotate secrets regularly
- Use least-privilege access for all services
- Monitor secret usage in GitHub Actions logs

## Environment-Specific Configuration

### Development
- Uses `.env.development` file
- No secrets required in GitHub
- Local database and Redis

### Staging
- Uses GitHub secrets for staging environment
- Separate staging database and Redis
- Automated deployment on push to `develop` branch

### Production
- Uses GitHub secrets for production environment
- Production database and Redis
- Manual deployment approval required
- Backup creation before deployment

## Testing Secrets

You can test if secrets are properly configured by:

1. Running the CI pipeline
2. Checking the deployment logs
3. Verifying application health endpoints
4. Testing authentication flows

## Troubleshooting

### Common Issues

1. **Secret not found**: Check if the secret name matches exactly
2. **Permission denied**: Verify SSH key has correct permissions
3. **Connection failed**: Check if hostnames and ports are correct
4. **Authentication failed**: Verify credentials are correct

### Debug Commands

```bash
# Test SSH connection
ssh -i /path/to/key user@host

# Test database connection
psql $DATABASE_URL

# Test Redis connection
redis-cli -u $REDIS_URL ping

# Test Docker login
echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
```

## Secret Rotation

### When to Rotate
- Every 90 days
- After any security incident
- When team members leave
- When changing hosting providers

### How to Rotate
1. Generate new secret
2. Update in GitHub Secrets
3. Update in target environment
4. Test deployment
5. Remove old secret

## Monitoring

- Monitor secret usage in GitHub Actions
- Set up alerts for failed deployments
- Log all secret access attempts
- Regular security audits