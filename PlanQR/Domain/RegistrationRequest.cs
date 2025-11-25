using System;

namespace Domain
{
    public class RegistrationRequest
    {
        public Guid Id { get; set; }
        public Guid DeviceId { get; set; }
        public string Code { get; set; } // 6 digits
        public DateTime ExpiresAt { get; set; }
        public bool IsCompleted { get; set; } = false;
        
        // Navigation properties
        public Device Device { get; set; }
    }
}
