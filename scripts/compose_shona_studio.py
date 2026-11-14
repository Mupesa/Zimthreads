import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_hangtag(scale=2.0):
    """
    Creates a photorealistic Zimthread Atelier hang-tag branded for SHONA REPUBLIC.
    Returns RGBA Image with transparent background.
    """
    tag_w = int(185 * scale)
    tag_h = int(275 * scale)
    
    # Base card
    card = Image.new("RGBA", (tag_w, tag_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    
    # Rounded card rect with luxury textured paper tone
    radius = int(12 * scale)
    card_bg = (250, 248, 242, 255) # Clean atelier ivory card stock
    draw.rounded_rectangle([0, 0, tag_w, tag_h], radius=radius, fill=card_bg)
    
    # Subtle inner border line (letterpress deboss effect)
    border_inset = int(4 * scale)
    draw.rounded_rectangle(
        [border_inset, border_inset, tag_w - border_inset, tag_h - border_inset],
        radius=max(2, radius - border_inset),
        outline=(232, 228, 218, 255),
        width=int(1 * scale)
    )
    
    # Eyelet hole at top center
    eyelet_cx = tag_w // 2
    eyelet_cy = int(26 * scale)
    eyelet_outer_r = int(8.5 * scale)
    eyelet_inner_r = int(4.5 * scale)
    
    # Metallic gunmetal grommet
    draw.ellipse(
        [eyelet_cx - eyelet_outer_r, eyelet_cy - eyelet_outer_r, eyelet_cx + eyelet_outer_r, eyelet_cy + eyelet_outer_r],
        fill=(35, 35, 38, 255),
        outline=(75, 75, 80, 255),
        width=int(1.5 * scale)
    )
    # Highlight on grommet rim
    draw.arc(
        [eyelet_cx - eyelet_outer_r, eyelet_cy - eyelet_outer_r, eyelet_cx + eyelet_outer_r, eyelet_cy + eyelet_outer_r],
        start=200, end=320,
        fill=(140, 140, 150, 255),
        width=int(1 * scale)
    )
    # Punched central hole (transparent)
    draw.ellipse(
        [eyelet_cx - eyelet_inner_r, eyelet_cy - eyelet_inner_r, eyelet_cx + eyelet_inner_r, eyelet_cy + eyelet_inner_r],
        fill=(0, 0, 0, 0)
    )
    
    # Fonts
    font_bold = None
    font_medium = None
    font_small = None
    font_mono = None
    
    possible_fonts = ["C:/Windows/Fonts/impact.ttf", "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/segoeuib.ttf"]
    for pf in possible_fonts:
        if os.path.exists(pf):
            try:
                font_bold = ImageFont.truetype(pf, int(22 * scale))
                font_medium = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", int(9.5 * scale))
                font_small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", int(7 * scale))
                font_mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", int(6.5 * scale))
                break
            except Exception:
                pass
    if font_bold is None:
        font_bold = ImageFont.load_default()
        font_medium = font_bold
        font_small = font_bold
        font_mono = font_bold

    # Draw Zimthread yellow cloud badge
    extracted_path = "public/images/extracted-tag.png"
    cloud_pasted = False
    if os.path.exists(extracted_path):
        try:
            ex = Image.open(extracted_path).convert("RGBA")
            cloud_crop = ex.crop((48, 126, 114, 176))
            arr = np.array(cloud_crop)
            is_yellow = (arr[:, :, 0] > 180) & (arr[:, :, 1] > 140) & (arr[:, :, 2] < 110)
            is_black = (arr[:, :, 0] < 70) & (arr[:, :, 1] < 70) & (arr[:, :, 2] < 70)
            alpha = np.where(is_yellow | is_black, 255, 0).astype(np.uint8)
            cloud_crop.putalpha(Image.fromarray(alpha))
            
            target_cloud_w = int(88 * scale)
            aspect = cloud_crop.height / cloud_crop.width
            target_cloud_h = int(target_cloud_w * aspect)
            cloud_resized = cloud_crop.resize((target_cloud_w, target_cloud_h), Image.Resampling.LANCZOS)
            
            cloud_x = (tag_w - target_cloud_w) // 2
            cloud_y = int(50 * scale)
            card.alpha_composite(cloud_resized, (cloud_x, cloud_y))
            cloud_pasted = True
        except Exception as e:
            print("Fallback cloud badge:", e)
            
    if not cloud_pasted:
        badge_w = int(85 * scale)
        badge_h = int(28 * scale)
        bx = (tag_w - badge_w) // 2
        by = int(52 * scale)
        draw.rounded_rectangle([bx, by, bx + badge_w, by + badge_h], radius=int(6*scale), fill=(245, 195, 35, 255), outline=(20, 20, 20, 255), width=int(1.5*scale))
        draw.text((bx + int(10*scale), by + int(5*scale)), "ZiMTHREAD", font=font_medium, fill=(20, 20, 20, 255))

    # Subheading: COLLECTIVE APPAREL
    sub_y = int(108 * scale)
    sub_text = "COLLECTIVE APPAREL"
    try:
        bbox = draw.textbbox((0, 0), sub_text, font=font_small)
        sub_w = bbox[2] - bbox[0]
        draw.text(((tag_w - sub_w) // 2, sub_y), sub_text, font=font_small, fill=(110, 105, 95, 255))
    except Exception:
        draw.text((int(40*scale), sub_y), sub_text, font=font_small, fill=(110, 105, 95, 255))

    # Main Headline: SHONA REPUBLIC (2 bold uppercase lines)
    title_y1 = int(126 * scale)
    title_text1 = "THE SHONA"
    title_text2 = "REPUBLIC"
    try:
        bb1 = draw.textbbox((0, 0), title_text1, font=font_bold)
        w1 = bb1[2] - bb1[0]
        draw.text(((tag_w - w1) // 2, title_y1), title_text1, font=font_bold, fill=(18, 18, 18, 255))
        
        title_y2 = title_y1 + int(24 * scale)
        bb2 = draw.textbbox((0, 0), title_text2, font=font_bold)
        w2 = bb2[2] - bb2[0]
        draw.text(((tag_w - w2) // 2, title_y2), title_text2, font=font_bold, fill=(18, 18, 18, 255))
    except Exception:
        draw.text((int(25*scale), title_y1), "SHONA REPUBLIC", font=font_bold, fill=(18, 18, 18, 255))

    # Dividing thin rule
    div_y = int(188 * scale)
    draw.line([(int(25 * scale), div_y), (tag_w - int(25 * scale), div_y)], fill=(215, 210, 198, 255), width=int(1 * scale))

    # Tag bottom details
    det1 = "HERITAGE ATELIER EDITION"
    det2 = "HEAVYWEIGHT 260 GSM // BESPOKE"
    det3 = "SERIAL NO: ZW-263-SR"
    
    d1_y = int(197 * scale)
    try:
        b1 = draw.textbbox((0, 0), det1, font=font_small)
        draw.text(((tag_w - (b1[2]-b1[0])) // 2, d1_y), det1, font=font_small, fill=(65, 65, 65, 255))
        
        d2_y = int(211 * scale)
        b2 = draw.textbbox((0, 0), det2, font=font_small)
        draw.text(((tag_w - (b2[2]-b2[0])) // 2, d2_y), det2, font=font_small, fill=(115, 110, 100, 255))
        
        d3_y = int(229 * scale)
        b3 = draw.textbbox((0, 0), det3, font=font_mono)
        draw.text(((tag_w - (b3[2]-b3[0])) // 2, d3_y), det3, font=font_mono, fill=(135, 130, 120, 255))
    except Exception:
        pass

    # Clean barcode at bottom
    bar_y = int(244 * scale)
    bar_h = int(13 * scale)
    bar_cx = tag_w // 2
    bar_total_w = int(80 * scale)
    bar_start_x = bar_cx - bar_total_w // 2
    np.random.seed(101)
    cur_x = bar_start_x
    while cur_x < bar_start_x + bar_total_w:
        line_w = int(np.random.choice([1, 2, 3]) * scale)
        gap_w = int(np.random.choice([1, 2]) * scale)
        draw.rectangle([cur_x, bar_y, cur_x + line_w, bar_y + bar_h], fill=(45, 45, 45, 255))
        cur_x += line_w + gap_w

    return card

def composite_studio_product(
    shirt_png_path,
    output_jpg_path,
    include_tag=True,
    canvas_size=(1600, 1600),
    is_front=True
):
    print(f"Compositing studio product: {shirt_png_path} -> {output_jpg_path} (tag={include_tag})")
    shirt = Image.open(shirt_png_path).convert("RGBA")
    
    # 1. Base studio canvas (pure seamless high-end white studio background matching LLICYLAND)
    canvas = Image.new("RGBA", canvas_size, (254, 254, 254, 255))
    
    # Bounding box of the shirt
    bbox = shirt.getbbox()
    shirt_cropped = shirt.crop(bbox)
    
    # Target shirt width: 1300 px (81% of canvas width)
    target_shirt_w = int(canvas_size[0] * 0.81)
    aspect = shirt_cropped.height / shirt_cropped.width
    target_shirt_h = int(target_shirt_w * aspect)
    shirt_scaled = shirt_cropped.resize((target_shirt_w, target_shirt_h), Image.Resampling.LANCZOS)
    
    # Shirt position on canvas (centered horizontally, perfectly balanced)
    pos_x = (canvas_size[0] - target_shirt_w) // 2
    pos_y = int((canvas_size[1] - target_shirt_h) // 2) + 20
    
    # 2. Multi-layer ambient occlusion & contact shadow under the shirt
    alpha = shirt_scaled.split()[3]
    
    # Layer A: Deep contact shadow (tight, directly underneath)
    shadow_contact = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    shadow_mask_a = alpha.point(lambda p: int(p * 0.20) if p > 0 else 0)
    shadow_img_a = Image.new("RGBA", (target_shirt_w, target_shirt_h), (25, 25, 25, 255))
    shadow_contact.paste(shadow_img_a, (pos_x, pos_y + 10), mask=shadow_mask_a)
    shadow_contact = shadow_contact.filter(ImageFilter.GaussianBlur(9))
    
    # Layer B: Diffuse floor ambient bounce (softer, wider)
    shadow_floor = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    shadow_mask_b = alpha.point(lambda p: int(p * 0.10) if p > 0 else 0)
    shadow_img_b = Image.new("RGBA", (target_shirt_w, target_shirt_h), (40, 40, 40, 255))
    shadow_floor.paste(shadow_img_b, (pos_x, pos_y + 28), mask=shadow_mask_b)
    shadow_floor = shadow_floor.filter(ImageFilter.GaussianBlur(28))
    
    # Paste shadows onto studio canvas
    canvas.alpha_composite(shadow_floor)
    canvas.alpha_composite(shadow_contact)
    
    # Paste shirt
    canvas.alpha_composite(shirt_scaled, (pos_x, pos_y))
    
    # 3. If front view and include_tag, render authentic Zimthread Atelier hang-tag pinned to collar!
    if include_tag and is_front:
        scale = 1.05
        tag_img = create_hangtag(scale=scale)
        
        # In LLICYLAND, tag hangs at ~16 degree angle on the right collar
        tag_angle = -16
        tag_rotated = tag_img.rotate(tag_angle, expand=True, resample=Image.Resampling.BICUBIC)
        
        # Hang-tag drop shadow on top of the shirt
        tag_alpha = tag_rotated.split()[3]
        tag_shadow = Image.new("RGBA", tag_rotated.size, (0, 0, 0, 0))
        tag_shadow_mask = tag_alpha.point(lambda p: int(p * 0.22) if p > 0 else 0)
        tag_shadow_black = Image.new("RGBA", tag_rotated.size, (15, 15, 15, 255))
        tag_shadow.paste(tag_shadow_black, (0, 0), mask=tag_shadow_mask)
        tag_shadow = tag_shadow.filter(ImageFilter.GaussianBlur(7))
        
        # Position tag on upper right collar/shoulder:
        # In 1600x1600 canvas:
        # collar center is at (pos_x + target_shirt_w * 0.50, pos_y + target_shirt_h * 0.08)
        # Right collar ribbing is around pos_x + target_shirt_w * 0.58
        tag_x = int(pos_x + target_shirt_w * 0.59)
        tag_y = int(pos_y + target_shirt_h * 0.04)
        
        # Eyelet coordinates after rotation
        # Tag original dimensions:
        ow, oh = tag_img.size
        # Center of rotation before expand:
        cx_orig, cy_orig = ow / 2.0, oh / 2.0
        # Eyelet hole in unrotated tag:
        ex_orig, ey_orig = ow / 2.0, 26.0 * scale
        
        # New rotated bounding box dimensions:
        rw, rh = tag_rotated.size
        rad = math.radians(-tag_angle) # PIL rotates counter-clockwise
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)
        
        # Delta from center of tag:
        dx = ex_orig - cx_orig
        dy = ey_orig - cy_orig
        
        # Rotated delta:
        rx = dx * cos_a + dy * sin_a
        ry = -dx * sin_a + dy * cos_a
        
        # In tag_rotated image coordinates:
        eyelet_canvas_x = tag_x + int(rw / 2.0 + rx)
        eyelet_canvas_y = tag_y + int(rh / 2.0 + ry)
        
        # Collar attachment anchor point:
        # Pinned under collar ribbing seam (inside neck opening)
        collar_pin_x = int(pos_x + target_shirt_w * 0.525)
        collar_pin_y = int(pos_y + target_shirt_h * 0.065)
        
        # Draw realistic looped black cord
        cord_layer = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        cord_draw = ImageDraw.Draw(cord_layer)
        cord_shadow_layer = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        cord_shadow_draw = ImageDraw.Draw(cord_shadow_layer)
        
        # Strand 1: from collar pin looping over collar to eyelet
        # Bezier curve
        p0 = (collar_pin_x, collar_pin_y)
        p1 = (collar_pin_x + 5, collar_pin_y - 22) # loop over collar ribbing
        p2 = (eyelet_canvas_x - 18, eyelet_canvas_y - 25)
        p3 = (eyelet_canvas_x, eyelet_canvas_y)
        
        pts1 = []
        for t in np.linspace(0, 1, 50):
            x = (1-t)**3 * p0[0] + 3*(1-t)**2*t * p1[0] + 3*(1-t)*t**2 * p2[0] + t**3 * p3[0]
            y = (1-t)**3 * p0[1] + 3*(1-t)**2*t * p1[1] + 3*(1-t)*t**2 * p2[1] + t**3 * p3[1]
            pts1.append((x, y))
            
        # Strand 2 (return loop):
        p0_b = (collar_pin_x - 3, collar_pin_y + 2)
        p1_b = (collar_pin_x + 2, collar_pin_y - 26)
        p2_b = (eyelet_canvas_x - 14, eyelet_canvas_y - 28)
        p3_b = (eyelet_canvas_x - 2, eyelet_canvas_y)
        
        pts2 = []
        for t in np.linspace(0, 1, 50):
            x = (1-t)**3 * p0_b[0] + 3*(1-t)**2*t * p1_b[0] + 3*(1-t)*t**2 * p2_b[0] + t**3 * p3_b[0]
            y = (1-t)**3 * p0_b[1] + 3*(1-t)**2*t * p1_b[1] + 3*(1-t)*t**2 * p2_b[1] + t**3 * p3_b[1]
            pts2.append((x, y))
            
        # Draw cord shadow
        for pts in [pts1, pts2]:
            for i in range(len(pts) - 1):
                cord_shadow_draw.line(
                    [(pts[i][0] + 3, pts[i][1] + 5), (pts[i+1][0] + 3, pts[i+1][1] + 5)],
                    fill=(15, 15, 15, 60),
                    width=int(2.5 * scale)
                )
        cord_shadow_layer = cord_shadow_layer.filter(ImageFilter.GaussianBlur(3))
        canvas.alpha_composite(cord_shadow_layer)
        
        # Draw cord strands
        for pts in [pts1, pts2]:
            for i in range(len(pts) - 1):
                cord_draw.line(
                    [pts[i], pts[i+1]],
                    fill=(30, 30, 32, 255),
                    width=int(1.8 * scale)
                )
                
        # Safety pin / fastener clasp on collar
        cord_draw.rounded_rectangle(
            [collar_pin_x - 6, collar_pin_y - 6, collar_pin_x + 6, collar_pin_y + 6],
            radius=3,
            fill=(22, 22, 24, 255)
        )
        
        # Composite cord
        canvas.alpha_composite(cord_layer)
        
        # Composite tag shadow and tag
        canvas.alpha_composite(tag_shadow, (tag_x + 6, tag_y + 8))
        canvas.alpha_composite(tag_rotated, (tag_x, tag_y))
        
        # Draw the eyelet grommet ring over the cord knot for perfect layering
        knot_layer = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        knot_draw = ImageDraw.Draw(knot_layer)
        knot_draw.ellipse(
            [eyelet_canvas_x - int(3*scale), eyelet_canvas_y - int(3*scale), eyelet_canvas_x + int(3*scale), eyelet_canvas_y + int(3*scale)],
            fill=(28, 28, 30, 255)
        )
        canvas.alpha_composite(knot_layer)
        
    # Save final high-quality JPEG
    os.makedirs(os.path.dirname(output_jpg_path), exist_ok=True)
    rgb_final = canvas.convert("RGB")
    rgb_final.save(output_jpg_path, "JPEG", quality=96, optimize=True)
    print(f"Saved: {output_jpg_path} ({rgb_final.size})")

def main():
    out_dir = "public/images/products/republic-of-shona"
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. White Front (Main product photo with hangtag like LLICYLAND)
    composite_studio_product(
        "Replublic of Shona/transparent/shona-republic-tee-white-front.png",
        os.path.join(out_dir, "shona-republic-tee-white-studio-front.jpg"),
        include_tag=True,
        is_front=True
    )
    
    # 2. White Front (Clean alternate view without tag)
    composite_studio_product(
        "Replublic of Shona/transparent/shona-republic-tee-white-front.png",
        os.path.join(out_dir, "shona-republic-tee-white-clean-front.jpg"),
        include_tag=False,
        is_front=True
    )
    
    # 3. White Back (+263 Artwork studio view)
    composite_studio_product(
        "Replublic of Shona/transparent/shona-republic-tee-white-back.png",
        os.path.join(out_dir, "shona-republic-tee-white-studio-back.jpg"),
        include_tag=False,
        is_front=False
    )
    
    # 4. Black Front (Main product photo with hangtag like LLICYLAND)
    composite_studio_product(
        "Replublic of Shona/transparent/shona-republic-tee-black-front.png",
        os.path.join(out_dir, "shona-republic-tee-black-studio-front.jpg"),
        include_tag=True,
        is_front=True
    )
    
    # 5. Black Front (Clean alternate view without tag)
    composite_studio_product(
        "Replublic of Shona/transparent/shona-republic-tee-black-front.png",
        os.path.join(out_dir, "shona-republic-tee-black-clean-front.jpg"),
        include_tag=False,
        is_front=True
    )
    
    # 6. Black Back (+263 Artwork studio view)
    composite_studio_product(
        "Replublic of Shona/transparent/shona-republic-tee-black-back.png",
        os.path.join(out_dir, "shona-republic-tee-black-studio-back.jpg"),
        include_tag=False,
        is_front=False
    )

if __name__ == "__main__":
    main()
