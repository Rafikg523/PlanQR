using System;

namespace Domain
{
    public class DeviceAssignment
    {
        public Guid Id { get; set; }
        public Guid DeviceId { get; set; }
        public Guid RoomId { get; set; }
        public string SecretKey { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public Device Device { get; set; }
        public Room Room { get; set; }
    }
}
