using Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegistryController : ControllerBase
    {
        private readonly DataContext _context;

        public RegistryController(DataContext context)
        {
            _context = context;
        }

        // GET /api/registry/status?deviceId=...
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus([FromQuery] Guid deviceId)
        {
            var assignment = await _context.DeviceAssignments
                .Include(a => a.Room)
                .FirstOrDefaultAsync(a => a.DeviceId == deviceId);

            if (assignment != null)
            {
                return Ok(new
                {
                    status = "assigned",
                    roomId = assignment.RoomId,
                    roomName = assignment.Room.Name,
                    secretKey = assignment.SecretKey
                });
            }

            var request = await _context.RegistrationRequests
                .FirstOrDefaultAsync(r => r.DeviceId == deviceId && !r.IsCompleted && r.ExpiresAt > DateTime.UtcNow);

            if (request != null)
            {
                return Ok(new
                {
                    status = "pending",
                    code = request.Code,
                    expiresAt = request.ExpiresAt
                });
            }

            return Ok(new { status = "unregistered" });
        }

        // POST /api/registry/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var device = await _context.Devices.FindAsync(dto.DeviceId);
            if (device == null)
            {
                device = new Device
                {
                    Id = dto.DeviceId,
                    Manufacturer = dto.Manufacturer,
                    Model = dto.Model
                };
                _context.Devices.Add(device);
            }

            // Invalidate old requests
            var oldRequests = await _context.RegistrationRequests
                .Where(r => r.DeviceId == dto.DeviceId && !r.IsCompleted)
                .ToListAsync();
            _context.RegistrationRequests.RemoveRange(oldRequests);

            // Generate unique 6-digit code
            string code;
            do
            {
                code = new Random().Next(100000, 999999).ToString();
            } while (await _context.RegistrationRequests.AnyAsync(r => r.Code == code && !r.IsCompleted));

            var request = new RegistrationRequest
            {
                Id = Guid.NewGuid(),
                DeviceId = dto.DeviceId,
                Code = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            };

            _context.RegistrationRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new { code = request.Code, expiresAt = request.ExpiresAt });
        }

        // POST /api/registry/admin/assign
        [HttpPost("admin/assign")]
        public async Task<IActionResult> AssignRoom([FromBody] AssignRoomDto dto)
        {
            var request = await _context.RegistrationRequests
                .Include(r => r.Device)
                .FirstOrDefaultAsync(r => r.Code == dto.Code && !r.IsCompleted && r.ExpiresAt > DateTime.UtcNow);

            if (request == null)
            {
                return BadRequest("Invalid or expired code.");
            }

            // Find or create room by name
            var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Name == dto.RoomName);
            if (room == null)
            {
                room = new Room { Id = Guid.NewGuid(), Name = dto.RoomName };
                _context.Rooms.Add(room);
                // Save changes to get the Room ID if needed, though we generated it.
                // We'll save everything at the end.
            }

            // Create assignment
            var assignment = new DeviceAssignment
            {
                Id = Guid.NewGuid(),
                DeviceId = request.DeviceId,
                RoomId = room.Id,
                SecretKey = Guid.NewGuid().ToString("N") // Simple secret key
            };

            _context.DeviceAssignments.Add(assignment);

            // Mark request as completed
            request.IsCompleted = true;

            // Remove old assignments for this device
            var oldAssignments = await _context.DeviceAssignments
                .Where(a => a.DeviceId == request.DeviceId && a.Id != assignment.Id)
                .ToListAsync();
            _context.DeviceAssignments.RemoveRange(oldAssignments);

            await _context.SaveChangesAsync();

            return Ok(new { status = "assigned", deviceId = request.DeviceId, roomId = room.Id });
        }

        // GET /api/registry/admin/requests
        [HttpGet("admin/requests")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var requests = await _context.RegistrationRequests
                .Include(r => r.Device)
                .Where(r => !r.IsCompleted && r.ExpiresAt > DateTime.UtcNow)
                .Select(r => new
                {
                    r.Id,
                    r.DeviceId,
                    r.Code,
                    r.ExpiresAt,
                    Device = new { r.Device.Manufacturer, r.Device.Model }
                })
                .ToListAsync();

            return Ok(requests);
        }
        
        // GET /api/registry/rooms (Helper for admin)
        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms()
        {
            var rooms = await _context.Rooms.ToListAsync();
            return Ok(rooms);
        }

        // POST /api/registry/rooms (Helper to create rooms)
        [HttpPost("rooms")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto dto)
        {
            var room = new Room { Id = Guid.NewGuid(), Name = dto.Name };
            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();
            return Ok(room);
        }
    }

    public class RegisterDto
    {
        public Guid DeviceId { get; set; }
        public string Manufacturer { get; set; }
        public string Model { get; set; }
    }

    public class AssignRoomDto
    {
        public string Code { get; set; }
        public string RoomName { get; set; }
    }

    public class CreateRoomDto
    {
        public string Name { get; set; }
    }
}
