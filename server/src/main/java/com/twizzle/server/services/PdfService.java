package com.twizzle.server.services;

import com.itextpdf.html2pdf.HtmlConverter;
import com.twizzle.server.models.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class PdfService {

    public byte[] generateUserProfilePdf(User user) throws IOException {
        try {
            String htmlContent = generateHtmlTemplate(user);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            HtmlConverter.convertToPdf(htmlContent, outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF for user {}: {}", user.getId(), e.getMessage());
            throw new IOException("Failed to generate PDF", e);
        }
    }

    private String generateHtmlTemplate(User user) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<style>");
        html.append(getCssStyles());
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");

        html.append("<div class='container'>");

        html.append("<div class='sidebar'>");
        html.append("<div class='sidebar-section'>");
        html.append("<h3>Contact</h3>");
        if (user.getEmail() != null) {
            html.append("<p class='contact-item'><strong>Email:</strong><br/><span class='email-text'>")
                    .append(user.getEmail()).append("</span></p>");
        }
        if (!user.getLinks().isEmpty()) {
            html.append("<p class='contact-item'><strong>Links:</strong></p>");
            for (String link : user.getLinks()) {
                html.append("<p class='link-item'><a href='").append(link).append("' target='_blank' class='link-url'>")
                        .append(link).append("</a></p>");
            }
        }
        html.append("</div>");

        if (!user.getSkills().isEmpty()) {
            html.append("<div class='sidebar-section'>");
            html.append("<h3>Top Skills</h3>");
            List<Skill> topSkills = user.getSkills().stream().limit(8).toList();
            for (Skill skill : topSkills) {
                html.append("<div class='skill-item'>");
                html.append("<span class='skill-name'>").append(skill.getSkillName()).append("</span>");
                html.append("</div>");
            }
            html.append("</div>");
        }

        if (!user.getCertificates().isEmpty()) {
            html.append("<div class='sidebar-section'>");
            html.append("<h3>Certifications</h3>");
            for (Certificate cert : user.getCertificates()) {
                html.append("<div class='cert-item'>");
                html.append("<p class='cert-name'>").append(cert.getName()).append("</p>");
                if (cert.getIssuingOrganization() != null) {
                    html.append("<p class='cert-org'>").append(cert.getIssuingOrganization()).append("</p>");
                }
                if (cert.getIssueDate() != null) {
                    html.append("<p class='cert-date'>").append(cert.getIssueDate().format(formatter)).append("</p>");
                }
                html.append("</div>");
            }
            html.append("</div>");
        }

        html.append("</div>");

        html.append("<div class='main-content'>");

        html.append("<div class='header'>");
        String displayName = user.getFullName() != null && !user.getFullName().trim().isEmpty()
                ? user.getFullName()
                : user.getUsername();
        html.append("<h1 class='name'>").append(displayName).append("</h1>");
        if (user.getBio() != null && user.getTitle() != null) {
            html.append("<p class='bio-title'>").append(user.getBio()).append(" - ").append(user.getTitle())
                    .append("</p>");
        } else if (user.getBio() != null) {
            html.append("<p class='bio-title'>").append(user.getBio()).append("</p>");
        } else if (user.getTitle() != null) {
            html.append("<p class='bio-title'>").append(user.getTitle()).append("</p>");
        }
        html.append("</div>");

        if (user.getAbout() != null && !user.getAbout().trim().isEmpty()) {
            html.append("<div class='section'>");
            html.append("<h2>Professional Summary</h2>");
            html.append("<p class='about'>").append(user.getAbout()).append("</p>");
            html.append("</div>");
        }

        if (!user.getExperiences().isEmpty()) {
            html.append("<div class='section'>");
            html.append("<h2>Experience</h2>");
            for (Experience exp : user.getExperiences()) {
                html.append("<div class='experience-item'>");
                if (exp.getCompany() != null) {
                    html.append("<h3 class='company-name'>").append(exp.getCompany()).append("</h3>");
                }
                if (exp.getPosition() != null) {
                    html.append("<p class='position-title'>").append(exp.getPosition()).append("</p>");
                }

                StringBuilder dateRange = new StringBuilder();
                if (exp.getStartDate() != null) {
                    dateRange.append(exp.getStartDate().format(DateTimeFormatter.ofPattern("MMMM yyyy")));
                    if (exp.getEndDate() != null) {
                        dateRange.append(" - ")
                                .append(exp.getEndDate().format(DateTimeFormatter.ofPattern("MMMM yyyy")));
                    } else {
                        dateRange.append(" - Present");
                    }
                    if (exp.getEndDate() != null) {
                        long months = java.time.temporal.ChronoUnit.MONTHS.between(exp.getStartDate(),
                                exp.getEndDate());
                        long years = months / 12;
                        long remainingMonths = months % 12;
                        if (years > 0) {
                            dateRange.append(" (").append(years).append(" year");
                            if (years > 1)
                                dateRange.append("s");
                            if (remainingMonths > 0) {
                                dateRange.append(" ").append(remainingMonths).append(" month");
                                if (remainingMonths > 1)
                                    dateRange.append("s");
                            }
                            dateRange.append(")");
                        } else if (remainingMonths > 0) {
                            dateRange.append(" (").append(remainingMonths).append(" month");
                            if (remainingMonths > 1)
                                dateRange.append("s");
                            dateRange.append(")");
                        }
                    }
                }
                if (!dateRange.isEmpty()) {
                    html.append("<p class='date-range'>").append(dateRange).append("</p>");
                }
                if (exp.getLocation() != null) {
                    html.append("<p class='location'>").append(exp.getLocation()).append("</p>");
                }
                html.append("</div>");
            }
            html.append("</div>");
        }

        if (!user.getEducation().isEmpty()) {
            html.append("<div class='section'>");
            html.append("<h2>Education</h2>");
            for (Education edu : user.getEducation()) {
                html.append("<div class='education-item'>");
                if (edu.getDegree() != null) {
                    html.append("<h3 class='degree'>").append(edu.getDegree()).append("</h3>");
                }
                if (edu.getInstitution() != null) {
                    html.append("<p class='institution'>").append(edu.getInstitution()).append("</p>");
                }
                if (edu.getFieldOfStudy() != null) {
                    html.append("<p class='field'>").append(edu.getFieldOfStudy()).append("</p>");
                }
                html.append("</div>");
            }
            html.append("</div>");
        }

        html.append("</div>");
        html.append("</div>");
        html.append("</body>");
        html.append("</html>");

        return html.toString();
    }

    private String getCssStyles() {
        return """
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                @page {
                    size: A4;
                    margin: 20mm;
                    counter-increment: page;
                    @bottom-right {
                        content: "Page " counter(page);
                        font-size: 12px;
                        color: #666;
                    }
                }

                body {
                    font-family: 'Georgia', 'Times New Roman', serif;
                    line-height: 1.5;
                    color: #333;
                    background: white;
                    font-size: 14px;
                }

                .container {
                    display: flex;
                    max-height: 100vh;
                    height: auto;
                    page-break-inside: avoid;
                }

                .sidebar {
                    width: 30%;
                    background: linear-gradient(135deg, #293e49, #1e2d36);
                    color: white;
                    padding: 30px 20px;
                    position: relative;
                }

                .sidebar::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.1);
                    z-index: 1;
                }

                .sidebar > * {
                    position: relative;
                    z-index: 2;
                }

                .sidebar-section {
                    margin-bottom: 25px;
                }

                .sidebar h3 {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border-bottom: 2px solid rgba(255,255,255,0.3);
                    padding-bottom: 10px;
                }

                .contact-item {
                    margin-bottom: 15px;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .email-text {
                    font-size: 12px;
                }

                .link-item {
                    font-size: 12px;
                    margin-bottom: 8px;
                    word-break: break-all;
                    opacity: 0.9;
                }

                .link-url {
                    color: rgba(255,255,255,0.9);
                    text-decoration: underline;
                    transition: color 0.2s ease;
                }

                .link-url:hover {
                    color: white;
                    text-decoration: none;
                }

                .skill-item {
                    background: rgba(255,255,255,0.2);
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    border-radius: 15px;
                    text-align: center;
                }

                .skill-name {
                    font-size: 13px;
                    font-weight: 500;
                }


                .cert-item {
                    background: rgba(255,255,255,0.15);
                    padding: 15px;
                    margin-bottom: 15px;
                    border-radius: 8px;
                    border-left: 4px solid rgba(255,255,255,0.5);
                }

                .cert-name {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 5px;
                }

                .cert-org {
                    font-size: 12px;
                    opacity: 0.9;
                    margin-bottom: 3px;
                }

                .cert-date {
                    font-size: 11px;
                    opacity: 0.8;
                }

                .main-content {
                    flex: 1;
                    padding: 30px 40px;
                    background: white;
                }

                .header {
                    margin-bottom: 30px;
                    border-bottom: 2px solid #293e49;
                    padding-bottom: 20px;
                }

                .name {
                    font-size: 36px;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 8px;
                    letter-spacing: -0.5px;
                }

                .bio-title {
                    font-size: 18px;
                    color: #666;
                    font-weight: 500;
                    margin-bottom: 10px;
                    line-height: 1.6;
                }


                .section {
                    margin-bottom: 25px;
                }

                .section h2 {
                    font-size: 24px;
                    color: #2c3e50;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 8px;
                    position: relative;
                    width: fit-content;
                }

                .section h2::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #293e49;
                }

                .about {
                    font-size: 16px;
                    line-height: 1.8;
                    color: #555;
                    text-align: justify;
                }

                .experience-item, .education-item {
                    margin-bottom: 18px;
                    padding: 0;
                    background: none;
                    border: none;
                }

                .company-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 3px;
                }

                .position-title {
                    font-size: 15px;
                    color: #293e49;
                    font-weight: 500;
                    margin-bottom: 3px;
                }

                .date-range {
                    font-size: 13px;
                    color: #666;
                    margin-bottom: 2px;
                }

                .location {
                    font-size: 12px;
                    color: #999;
                    margin-bottom: 10px;
                }

                .position, .degree {
                    font-size: 20px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 8px;
                }

                .institution {
                    font-size: 16px;
                    color: #293e49;
                    font-weight: 500;
                    margin-bottom: 10px;
                }

                .description, .field {
                    font-size: 14px;
                    color: #666;
                    line-height: 1.6;
                }

                """;
    }
}
