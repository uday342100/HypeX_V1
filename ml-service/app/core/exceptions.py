class MLServiceError(Exception):
    """Base exception for ML service errors."""
    def __init__(self, message: str, code: str = "ML_SERVICE_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class EmbeddingServiceError(MLServiceError):
    """Raised when embedding generation fails."""
    def __init__(self, message: str, original_error: Exception = None):
        super().__init__(message, "EMBEDDING_ERROR")
        self.original_error = original_error


class NormalizationError(MLServiceError):
    """Raised when text normalization fails."""
    def __init__(self, message: str):
        super().__init__(message, "NORMALIZATION_ERROR")


class ExtractionError(MLServiceError):
    """Raised when attribute extraction fails."""
    def __init__(self, message: str):
        super().__init__(message, "EXTRACTION_ERROR")


class MatchingError(MLServiceError):
    """Raised when material matching fails."""
    def __init__(self, message: str):
        super().__init__(message, "MATCHING_ERROR")


class ConfigurationError(MLServiceError):
    """Raised when configuration is invalid."""
    def __init__(self, message: str):
        super().__init__(message, "CONFIGURATION_ERROR")


class PipelineError(MLServiceError):
    """Raised when pipeline execution fails."""
    def __init__(self, message: str):
        super().__init__(message, "PIPELINE_ERROR")


class ClusteringError(MLServiceError):
    """Raised when clustering fails."""
    def __init__(self, message: str):
        super().__init__(message, "CLUSTERING_ERROR")