using System;

namespace Domain
{
    public class Device
    {
        public Guid Id { get; set; }
        public string Manufacturer { get; set; }
        public string Model { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
