#!/usr/bin/env python3
"""
Create Google Play Featured Graphic for GabAi
Dimensions: 1024 x 500 pixels
No AI generation - pure Python/PIL design
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os
import math

def create_gradient_background(width, height, color1, color2, direction='horizontal'):
    """Create a gradient background."""
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    
    for y in range(height):
        for x in range(width):
            if direction == 'horizontal':
                mask_data.append(int(255 * (x / width)))
            elif direction == 'vertical':
                mask_data.append(int(255 * (y / height)))
            elif direction == 'diagonal':
                mask_data.append(int(255 * ((x + y) / (width + height))))
            else:
                mask_data.append(int(255 * (x / width)))
    
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def draw_rounded_rect(draw, coords, radius, fill):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = coords
    draw.rounded_rectangle(coords, radius=radius, fill=fill)

def create_phone_mockup_mini(screenshot_path, size=(120, 240)):
    """Create a mini phone mockup for the featured graphic."""
    try:
        screenshot = Image.open(screenshot_path)
        screenshot = screenshot.convert("RGBA")
    except:
        screenshot = Image.new("RGBA", (1080, 2280), (255, 255, 255, 255))
    
    device_width, device_height = size
    bezel = 4
    corner_radius = 12
    
    screen_width = device_width - (bezel * 2)
    screen_height = device_height - 20
    
    screenshot_resized = screenshot.resize((screen_width, screen_height), Image.Resampling.LANCZOS)
    
    device = Image.new("RGBA", (device_width, device_height), (0, 0, 0, 0))
    device_draw = ImageDraw.Draw(device)
    
    device_draw.rounded_rectangle(
        [0, 0, device_width - 1, device_height - 1],
        radius=corner_radius,
        fill=(40, 40, 40, 255)
    )
    
    device.paste(screenshot_resized, (bezel, 10))
    
    return device

def create_featured_graphic():
    """Create the main featured graphic."""
    width = 1024
    height = 500
    
    background = create_gradient_background(
        width, height,
        (59, 130, 246),
        (37, 99, 235),
        'diagonal'
    )
    
    draw = ImageDraw.Draw(background)
    
    for i in range(0, width, 60):
        for j in range(0, height, 60):
            offset_x = 30 if (j // 60) % 2 == 1 else 0
            x = i + offset_x
            y = j
            draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(255, 255, 255, 30))
    
    wave_color = (255, 255, 255, 20)
    for wave_offset in range(0, 3):
        points = []
        for x in range(0, width + 20, 10):
            y = height - 100 + wave_offset * 30 + int(30 * math.sin((x + wave_offset * 50) / 80))
            points.append((x, y))
        points.append((width, height))
        points.append((0, height))
        draw.polygon(points, fill=(255, 255, 255, 15 + wave_offset * 5))
    
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    screenshots = [
        "attached_assets/Screenshot_20251127_102527_GabAi_1764262020485.jpg",
        "attached_assets/Screenshot_20251127_103036_GabAi_1764262020468.jpg",
        "attached_assets/Screenshot_20251127_103307_GabAi_1764262020435.jpg",
    ]
    
    phone_positions = [
        (720, 80, (130, 260), -5),
        (820, 50, (140, 280), 0),
        (900, 90, (120, 240), 8),
    ]
    
    for i, (x, y, size, angle) in enumerate(phone_positions):
        if i < len(screenshots) and os.path.exists(screenshots[i]):
            phone = create_phone_mockup_mini(screenshots[i], size)
            if angle != 0:
                phone = phone.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
            overlay.paste(phone, (x, y), phone)
    
    background = background.convert('RGBA')
    background = Image.alpha_composite(background, overlay)
    
    draw = ImageDraw.Draw(background)
    
    logo_size = 80
    logo_x = 60
    logo_y = height // 2 - 60
    
    draw.rounded_rectangle(
        [logo_x, logo_y, logo_x + logo_size, logo_y + logo_size],
        radius=18,
        fill=(255, 255, 255, 255)
    )
    
    check_color = (59, 130, 246)
    cx = logo_x + logo_size // 2
    cy = logo_y + logo_size // 2
    
    draw.ellipse([cx - 25, cy - 25, cx + 25, cy + 25], fill=check_color)
    
    check_points = [
        (cx - 12, cy),
        (cx - 4, cy + 10),
        (cx + 14, cy - 8)
    ]
    draw.line(check_points[0:2], fill=(255, 255, 255), width=5)
    draw.line(check_points[1:3], fill=(255, 255, 255), width=5)
    
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        tagline_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    except:
        try:
            title_font = ImageFont.truetype("/nix/store/*/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
            tagline_font = ImageFont.truetype("/nix/store/*/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        except:
            title_font = ImageFont.load_default()
            tagline_font = ImageFont.load_default()
    
    title_x = logo_x + logo_size + 30
    title_y = logo_y + 5
    
    draw.text((title_x + 2, title_y + 2), "GabAi", font=title_font, fill=(0, 0, 0, 80))
    draw.text((title_x, title_y), "GabAi", font=title_font, fill=(255, 255, 255))
    
    tagline = "Your AI Voice Assistant"
    tagline_y = title_y + 75
    draw.text((title_x + 1, tagline_y + 1), tagline, font=tagline_font, fill=(0, 0, 0, 60))
    draw.text((title_x, tagline_y), tagline, font=tagline_font, fill=(255, 255, 255, 230))
    
    features = ["Voice Chat", "Smart Lists", "Reminders"]
    feature_x = title_x
    feature_y = tagline_y + 50
    
    for i, feature in enumerate(features):
        fx = feature_x + i * 150
        
        draw.ellipse([fx, feature_y + 2, fx + 20, feature_y + 22], fill=(255, 255, 255, 200))
        draw.line([(fx + 5, feature_y + 12), (fx + 9, feature_y + 16)], fill=check_color, width=2)
        draw.line([(fx + 9, feature_y + 16), (fx + 15, feature_y + 8)], fill=check_color, width=2)
        
        draw.text((fx + 28, feature_y + 2), feature, font=tagline_font, fill=(255, 255, 255, 200))
    
    final = background.convert('RGB')
    
    output_path = "mockups/featured_graphic.png"
    final.save(output_path, "PNG", quality=95)
    print(f"Created: {output_path} ({width}x{height})")
    
    output_jpg = "mockups/featured_graphic.jpg"
    final.save(output_jpg, "JPEG", quality=90)
    print(f"Created: {output_jpg} ({width}x{height})")
    
    return final


if __name__ == "__main__":
    os.makedirs("mockups", exist_ok=True)
    create_featured_graphic()
    print("\nFeatured graphic ready for Google Play!")
