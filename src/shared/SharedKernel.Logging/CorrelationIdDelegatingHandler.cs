using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace SharedKernel.Logging
{
    public class CorrelationIdDelegatingHandler : DelegatingHandler
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CorrelationIdDelegatingHandler(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var context = _httpContextAccessor.HttpContext;
            string? correlationId = null;

            if (context != null && context.Items.TryGetValue(CorrelationIdMiddleware.CorrelationIdHeader, out var correlationIdObj))
            {
                correlationId = correlationIdObj?.ToString();
            }

            if (string.IsNullOrEmpty(correlationId))
            {
                correlationId = Guid.NewGuid().ToString("D");
            }

            if (!request.Headers.Contains(CorrelationIdMiddleware.CorrelationIdHeader))
            {
                request.Headers.Add(CorrelationIdMiddleware.CorrelationIdHeader, correlationId);
            }

            return await base.SendAsync(request, cancellationToken);
        }
    }
}
